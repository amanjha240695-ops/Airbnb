import prisma from "../config/db.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { sendOtpEmail } from "../services/emailService.js";

// Generate secure 6-digit random numeric string
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/host/request-onboarding
export const requestBecomeHost = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    if (!user) {
      return errorResponse(res, 404, "User account not found.");
    }

    // 1. Check Max 5 Properties Limit via Raw SQL 
    const countResult = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int as count FROM "Property" WHERE "hostId" = $1 AND "status" != 'DELISTED'`,
      userId
    );
    const propertyCount = countResult[0]?.count || 0;

    if (propertyCount >= 5) {
      return errorResponse(
        res,
        400,
        "Listing limit reached: A host can create a maximum of 5 active properties only."
      );
    }

    const {
      title,
      description,
      propertyType,
      address,
      city,
      state,
      zipCode,
      pricePerNight,
      guests,
      bedrooms,
      beds,
      bathrooms,
      hostPhotoId,
      propertyPhotoUrl,
    } = req.body;

    // Required validation
    if (!title || !description || !propertyType || !address || !city || !state || !zipCode) {
      return errorResponse(res, 400, "All property address and detail fields are required.");
    }
    if (!propertyPhotoUrl) {
      return errorResponse(res, 400, "At least one primary property photo is required.");
    }
    if (!pricePerNight || Number(pricePerNight) <= 0) {
      return errorResponse(res, 400, "Please provide a valid price per night.");
    }

    // 2. IF USER IS ALREADY A HOST: Directly create the property live
    if (user.role === "HOST") {
      const newProperty = await prisma.property.create({
        data: {
          title: title.trim(),
          description: description.trim(),
          propertyType,
          status: "APPROVED",
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          country: "India",
          zipCode: zipCode.trim(),
          guests: Number(guests) || 1,
          bedrooms: Number(bedrooms) || 1,
          beds: Number(beds) || 1,
          bathrooms: Number(bathrooms) || 1,
          pricePerNight: Number(pricePerNight),
          hostId: userId,
          images: {
            create: [
              {
                url: propertyPhotoUrl,
                isCover: true,
                sortOrder: 0,
              },
            ],
          },
        },
        include: {
          images: true,
        },
      });

      return successResponse(
        res,
        201,
        "Your new property is now live on Airbnb!",
        { newProperty, isAlreadyHost: true }
      );
    }

    // 3. FIRST-TIME HOST: Require Host Photo ID and trigger OTP flow
    if (!hostPhotoId) {
      return errorResponse(res, 400, "Host photo ID is mandatory for identity verification.");
    }

    await prisma.oTP.deleteMany({
      where: {
        userId,
        type: "BECOME_HOST",
      },
    });

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      propertyType,
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      zipCode: zipCode.trim(),
      pricePerNight: Number(pricePerNight),
      guests: Number(guests) || 1,
      bedrooms: Number(bedrooms) || 1,
      beds: Number(beds) || 1,
      bathrooms: Number(bathrooms) || 1,
      hostPhotoId,
      propertyPhotoUrl,
    };

    await prisma.oTP.create({
      data: {
        email: user.email,
        code: otpCode,
        type: "BECOME_HOST",
        payload,
        expiresAt,
        userId: user.id,
      },
    });

    // EmailJS REST API dispatch (Bypasses Nodemailer & Render port blocks)
    try {
      await sendOtpEmail(user.email, otpCode);
    } catch (mailError) {
      console.error("[Host Onboarding] EmailJS Dispatch Error:", mailError);
      return errorResponse(res, 500, "Failed to send verification code. Please try again.");
    }

    return successResponse(res, 200, `Verification OTP sent to ${user.email}. Enter code to go live.`);
  } catch (error) {
    console.error("Request Become Host Error:", error);
    return errorResponse(res, 500, error.message || "Server error processing host onboarding.");
  }
};

// POST /api/host/verify-onboarding
export const verifyBecomeHost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otpCode } = req.body;

    if (!otpCode || otpCode.trim().length !== 6) {
      return errorResponse(res, 400, "Please enter a valid 6-digit verification code.");
    }

    const otpRecord = await prisma.oTP.findFirst({
      where: {
        userId,
        type: "BECOME_HOST",
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return errorResponse(res, 400, "Verification code is expired or invalid. Request a new one.");
    }

    if (otpRecord.code !== otpCode.trim()) {
      await prisma.oTP.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      return errorResponse(res, 400, "Incorrect code entered. Please try again.");
    }

    const payload = otpRecord.payload;
    if (!payload) {
      return errorResponse(res, 400, "Staged property draft missing. Please re-fill the form.");
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.oTP.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          role: "HOST",
          idCardPhoto: payload.hostPhotoId,
          hostVerifiedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          avatar: true,
          idCardPhoto: true,
          hostVerifiedAt: true,
        },
      });

      const newProperty = await tx.property.create({
        data: {
          title: payload.title,
          description: payload.description,
          propertyType: payload.propertyType,
          status: "APPROVED",
          address: payload.address,
          city: payload.city,
          state: payload.state,
          country: "India",
          zipCode: payload.zipCode,
          guests: payload.guests,
          bedrooms: payload.bedrooms,
          beds: payload.beds,
          bathrooms: payload.bathrooms,
          pricePerNight: payload.pricePerNight,
          hostId: userId,
          images: {
            create: [
              {
                url: payload.propertyPhotoUrl,
                isCover: true,
                sortOrder: 0,
              },
            ],
          },
        },
        include: {
          images: true,
        },
      });

      return { updatedUser, newProperty };
    });

    return successResponse(res, 201, "Account verified! Your property is now live on Airbnb.", result);
  } catch (error) {
    console.error("Verify Become Host Error:", error);
    return errorResponse(res, 500, error.message || "Failed to verify host onboarding.");
  }
};

// GET /api/host/dashboard
export const getHostDashboard = async (req, res) => {
  try {
    const hostId = req.user.id;

    // Filter out DELISTED properties so they never appear on the host dashboard
    const rawProperties = await prisma.$queryRawUnsafe(`
      SELECT 
        p.*,
        COALESCE(
          (SELECT json_agg(img ORDER BY img."sortOrder" ASC) 
           FROM "PropertyImage" img 
           WHERE img."propertyId" = p.id), 
          '[]'::json
        ) AS images,
        json_build_object(
          'bookings', (SELECT COUNT(*)::int FROM "Booking" b WHERE b."propertyId" = p.id),
          'reviews', (SELECT COUNT(*)::int FROM "Review" r WHERE r."propertyId" = p.id)
        ) AS "_count"
      FROM "Property" p
      WHERE p."hostId" = $1 AND p."status" != 'DELISTED'
      ORDER BY p."createdAt" DESC
    `, hostId);

    const properties = rawProperties.map(p => ({
      ...p,
      pricePerNight: Number(p.pricePerNight),
      cleaningFee: Number(p.cleaningFee || 0),
      serviceFee: Number(p.serviceFee || 0),
    }));

    const propertyIds = properties.map((p) => p.id);

    let bookings = [];
    let reviews = [];

    if (propertyIds.length > 0) {
      bookings = await prisma.booking.findMany({
        where: {
          propertyId: { in: propertyIds },
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true, avatar: true },
          },
          property: {
            select: { 
              id: true, 
              title: true, 
              city: true, 
              address: true, 
              state: true, 
              zipCode: true, 
              propertyType: true,
              pricePerNight: true,
              cleaningFee: true,
              serviceFee: true,
              images: true,
            },
          },
          payment: {
            select: {
              id: true,
              status: true,
              amount: true,
              currency: true,
              method: true,
              razorpayPaymentId: true,
              razorpayOrderId: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      reviews = await prisma.review.findMany({
        where: {
          propertyId: { in: propertyIds },
        },
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
          property: {
            select: { id: true, title: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    const totalRevenue = bookings
      .filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED")
      .reduce((acc, curr) => acc + Number(curr.totalAmount || 0), 0);

    return successResponse(res, 200, "Host dashboard data fetched successfully", {
      stats: {
        totalListings: properties.length,
        totalBookings: bookings.length,
        totalReviews: reviews.length,
        totalRevenue,
      },
      properties,
      bookings,
      reviews,
    });
  } catch (error) {
    console.error("Host Dashboard Error:", error);
    return errorResponse(res, 500, error.message || "Failed to load dashboard data");
  }
};

// PATCH /api/host/properties/:id/price
export const updateListingPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const hostId = req.user.id;
    const { pricePerNight, cleaningFee, serviceFee } = req.body;

    const [property] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Property" WHERE "id" = $1 AND "hostId" = $2 LIMIT 1`,
      id,
      hostId
    );

    if (!property) {
      return errorResponse(res, 404, "Property not found or unauthorized");
    }

    const newCleaningFee = cleaningFee !== undefined ? parseFloat(cleaningFee) : Number(property.cleaningFee || 0);
    const newServiceFee = serviceFee !== undefined ? parseFloat(serviceFee) : Number(property.serviceFee || 0);

    await prisma.$executeRawUnsafe(
      `UPDATE "Property" 
       SET "pricePerNight" = $1, 
           "cleaningFee" = $2, 
           "serviceFee" = $3, 
           "updatedAt" = NOW() 
       WHERE "id" = $4`,
      parseFloat(pricePerNight),
      newCleaningFee,
      newServiceFee,
      id
    );

    const [updated] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Property" WHERE "id" = $1 LIMIT 1`,
      id
    );

    return successResponse(res, 200, "Listing price updated successfully on Airbnb", {
      property: updated,
    });
  } catch (error) {
    console.error("Price update error:", error);
    return errorResponse(res, 500, error.message || "Failed to update price");
  }
};

// PATCH /api/host/reviews/:id/publish
export const togglePublishReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    const review = await prisma.review.update({
      where: { id },
      data: { isPublished: Boolean(isPublished) },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        property: { select: { id: true, title: true } },
      },
    });

    return successResponse(
      res,
      200,
      isPublished ? "Review published live on listing!" : "Review hidden from listing",
      { review }
    );
  } catch (error) {
    console.error("Toggle Review Publish Error:", error);
    return errorResponse(res, 500, error.message || "Failed to toggle review status");
  }
};

// PATCH /api/host/properties/:id/snooze
export const snoozeProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const hostId = req.user.id;
    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate) {
      return errorResponse(res, 400, "Start date and end date are mandatory for archiving.");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return errorResponse(res, 400, "End date must be after the start date.");
    }

    const [property] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Property" WHERE "id" = $1 AND "hostId" = $2 LIMIT 1`,
      id,
      hostId
    );

    if (!property) {
      return errorResponse(res, 404, "Property not found or unauthorized.");
    }

    const activeConflicts = await prisma.booking.count({
      where: {
        propertyId: id,
        status: { in: ["CONFIRMED", "HOLD"] },
        checkIn: { lt: end },
        checkOut: { gt: start },
      },
    });

    if (activeConflicts > 0) {
      return errorResponse(
        res,
        400,
        `Cannot pause: You have ${activeConflicts} active booking(s) scheduled in this window. Resolve them before archiving.`
      );
    }

    try {
      await prisma.$executeRawUnsafe(
        `ALTER TYPE "PropertyStatus" ADD VALUE IF NOT EXISTS 'SNOOZED'`
      );
    } catch {}

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Property" 
        ADD COLUMN IF NOT EXISTS "snoozeStartDate" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "snoozeEndDate" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "snoozeReason" TEXT
      `);
    } catch {}

    await prisma.$executeRawUnsafe(
      `UPDATE "Property" 
       SET "status" = 'SNOOZED', 
           "snoozeStartDate" = $1, 
           "snoozeEndDate" = $2, 
           "snoozeReason" = $3, 
           "updatedAt" = NOW() 
       WHERE "id" = $4`,
      start,
      end,
      reason?.trim() || "Under renovation / Maintenance break",
      id
    );

    const [updated] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Property" WHERE "id" = $1 LIMIT 1`,
      id
    );

    return successResponse(
      res,
      200,
      `Property archived until ${end.toLocaleDateString("en-IN")}. It will stay hidden until you reactivate it.`,
      { property: updated }
    );
  } catch (error) {
    console.error("Snooze Property Error:", error);
    return errorResponse(res, 500, error.message || "Failed to pause property.");
  }
};

// PATCH /api/host/properties/:id/reactivate
export const reactivateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const hostId = req.user.id;

    const [property] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Property" WHERE "id" = $1 AND "hostId" = $2 LIMIT 1`,
      id,
      hostId
    );

    if (!property) {
      return errorResponse(res, 404, "Property not found or unauthorized.");
    }

    await prisma.$executeRawUnsafe(
      `UPDATE "Property" 
       SET "status" = 'APPROVED', 
           "snoozeStartDate" = NULL, 
           "snoozeEndDate" = NULL, 
           "snoozeReason" = NULL, 
           "updatedAt" = NOW() 
       WHERE "id" = $1`,
      id
    );

    const [updated] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Property" WHERE "id" = $1 LIMIT 1`,
      id
    );

    return successResponse(res, 200, "Property reactivated! Your stay is now live and searchable on Airbnb.", {
      property: updated,
    });
  } catch (error) {
    console.error("Reactivate Property Error:", error);
    return errorResponse(res, 500, error.message || "Failed to reactivate listing.");
  }
};

// POST /api/host/properties/:id/delist
export const permanentlyDelistProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const hostId = req.user.id;
    const { category, reason } = req.body;

    if (!category || !reason || reason.trim().length < 10) {
      return errorResponse(
        res,
        400,
        "Please provide a category and detailed feedback (minimum 10 characters) explaining why you are delisting."
      );
    }

    const [property] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Property" WHERE "id" = $1 AND "hostId" = $2 LIMIT 1`,
      id,
      hostId
    );

    if (!property) {
      return errorResponse(res, 404, "Property not found or unauthorized.");
    }

    const upcomingStays = await prisma.booking.count({
      where: {
        propertyId: id,
        status: "CONFIRMED",
        checkOut: { gt: new Date() },
      },
    });

    if (upcomingStays > 0) {
      return errorResponse(
        res,
        400,
        `Cannot delist: You have ${upcomingStays} upcoming reservation(s). You must complete or cancel these bookings first.`
      );
    }

    try {
      await prisma.$executeRawUnsafe(
        `ALTER TYPE "PropertyStatus" ADD VALUE IF NOT EXISTS 'DELISTED'`
      );
    } catch {}

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Property" 
        ADD COLUMN IF NOT EXISTS "delistCategory" TEXT,
        ADD COLUMN IF NOT EXISTS "delistReason" TEXT,
        ADD COLUMN IF NOT EXISTS "delistedAt" TIMESTAMP(3)
      `);
    } catch {}

    await prisma.$executeRawUnsafe(
      `UPDATE "Property" 
       SET "status" = 'DELISTED', 
           "delistCategory" = $1, 
           "delistReason" = $2, 
           "delistedAt" = NOW(), 
           "updatedAt" = NOW() 
       WHERE "id" = $3`,
      category,
      reason.trim(),
      id
    );

    const [updated] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Property" WHERE "id" = $1 LIMIT 1`,
      id
    );

    return successResponse(
      res,
      200,
      "Property permanently delisted. It has been deactivated from Airbnb search.",
      { property: updated }
    );
  } catch (error) {
    console.error("Delist Property Error Details:", error);
    return errorResponse(res, 500, error.message || "Failed to delist property.");
  }
};