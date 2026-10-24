import prisma from "../config/db.js";

// Sirf CONFIRMED / COMPLETED bookings par hi calendar lock hoga
export const getPropertyLockedDates = async (propertyId) => {
  if (!propertyId) {
    throw new Error("Property ID is required");
  }

  const lockedBookings = await prisma.booking.findMany({
    where: {
      propertyId,
      status: {
        in: ["CONFIRMED", "COMPLETED"], // No HOLD blocking
      },
    },
    select: {
      id: true,
      checkIn: true,
      checkOut: true,
      status: true,
    },
    orderBy: {
      checkIn: "asc",
    },
  });

  return lockedBookings;
};

export const createBooking = async (userId, bookingData) => {
  const { propertyId, checkIn, checkOut, guests } = bookingData;

  if (!propertyId || !checkIn || !checkOut) {
    throw new Error("Property ID, check-in, and check-out dates are required");
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
    throw new Error("Invalid date format. Use ISO format (YYYY-MM-DD)");
  }

  // Graceful end date calculation (at least 1 night)
  let effectiveEnd = checkOutDate;
  if (checkOutDate <= checkInDate) {
    effectiveEnd = new Date(checkInDate.getTime() + 24 * 60 * 60 * 1000);
  }

  // 1. Fetch Property Details
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!property) {
    throw new Error("Property listing not found");
  }

  // 2. Prevent Host from booking their own place (Skip in Dev testing agar zaroorat ho)
  if (property.hostId === userId && process.env.NODE_ENV === "production") {
    throw new Error("You cannot book your own hosted property. Please test with another account.");
  }

  // 3. Guest capacity check
  const guestCount = Math.max(1, parseInt(guests, 10) || 1);
  if (property.guests && guestCount > property.guests) {
    throw new Error(
      `This property accommodates a maximum of ${property.guests} guests`
    );
  }

  // 4. Calculate Nights & Pricing safely
  const diffTime = Math.abs(effectiveEnd.getTime() - checkInDate.getTime());
  const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const pricePerNight = Number(property.pricePerNight) || 0;
  const cleaningFee = Number(property.cleaningFee) || 0;
  const serviceFee = Number(property.serviceFee) || 0;

  const subtotal = nights * pricePerNight;
  const totalAmount = subtotal + cleaningFee + serviceFee;

  // 5. Check if ALREADY CONFIRMED by someone else
  const alreadyConfirmed = await prisma.booking.findFirst({
    where: {
      propertyId,
      status: { in: ["CONFIRMED", "COMPLETED"] },
      AND: [
        { checkIn: { lt: effectiveEnd } },
        { checkOut: { gt: checkInDate } },
      ],
    },
  });

  if (alreadyConfirmed) {
    throw new Error("These dates have already been booked and paid for. Please choose different dates.");
  }

  // 6. Create booking intent directly with status: PENDING
  const booking = await prisma.booking.create({
    data: {
      checkIn: checkInDate,
      checkOut: effectiveEnd,
      guests: guestCount,
      nights,
      pricePerNight,
      subtotal,
      cleaningFee,
      serviceFee,
      totalAmount,
      status: "PENDING",
      holdExpiresAt: null,
      userId,
      propertyId,
    },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          city: true,
          address: true,
          pricePerNight: true,
          images: true,
          host: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return booking;
};

export const getUserBookings = async (userId) => {
  return await prisma.booking.findMany({
    where: {
      userId,
      status: {
        in: ["CONFIRMED", "COMPLETED", "CANCELLED", "PENDING"],
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          city: true,
          address: true,
          pricePerNight: true,
          images: true,
          host: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      payment: true,
    },
  });
};

export const cancelBooking = async (userId, bookingId, reason) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.userId !== userId) {
    throw new Error("You are not authorized to cancel this booking");
  }

  if (booking.status === "CANCELLED") {
    throw new Error("Booking is already cancelled");
  }

  return await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "CANCELLED",
      cancellationReason: reason || "Cancelled by guest",
      holdExpiresAt: null,
    },
  });
};