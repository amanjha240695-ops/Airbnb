import prisma from "../config/db.js";

export const createProperty = async (hostId, propertyData) => {
  const {
    title,
    description,
    propertyType = "APARTMENT",
    pricePerNight,
    cleaningFee = 0,
    serviceFee = 0,
    address,
    city,
    state = "Delhi",
    country = "India",
    zipCode,
    latitude,
    longitude,
    guests = 1,
    bedrooms = 1,
    beds = 1,
    bathrooms = 1.0,
    images = [],
    amenityIds = [],
  } = propertyData;

  if (!title || !description || !pricePerNight || !address || !city) {
    throw new Error(
      "Missing required property fields: title, description, pricePerNight, address, city"
    );
  }

  // 1. Strict Max 5 Properties Limit Check per Host (Excludes DELISTED properties safely via SQL)
  const countResult = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int as count FROM "Property" WHERE "hostId" = $1 AND "status" != 'DELISTED'`,
    hostId
  );
  const existingPropertiesCount = countResult[0]?.count || 0;

  if (existingPropertiesCount >= 5) {
    throw new Error(
      "Listing limit reached: A host can create a maximum of 5 properties."
    );
  }

  // 2. Create property record
  const property = await prisma.property.create({
    data: {
      title: title.trim(),
      description: description.trim(),
      propertyType,
      status: "APPROVED",
      pricePerNight: parseFloat(pricePerNight),
      cleaningFee: parseFloat(cleaningFee),
      serviceFee: parseFloat(serviceFee),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      zipCode: zipCode ? zipCode.trim() : null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      guests: parseInt(guests, 10),
      bedrooms: parseInt(bedrooms, 10),
      beds: parseInt(beds, 10),
      bathrooms: parseFloat(bathrooms),
      hostId,
      images: {
        create: images.map((img, index) => ({
          url: typeof img === "string" ? img : img.url,
          publicId: typeof img === "object" ? img.publicId : null,
          isCover: index === 0,
          sortOrder: index,
        })),
      },
      amenities: {
        create: amenityIds.map((amenityId) => ({
          amenityId,
        })),
      },
    },
    include: {
      images: true,
      amenities: {
        include: {
          amenity: true,
        },
      },
      host: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  return property;
};

export const getProperties = async (filters = {}) => {
  const {
    destination,
    city,
    propertyType,
    minPrice,
    maxPrice,
    guests,
    checkIn,
    checkOut,
    page = 1,
    limit = 12,
  } = filters;

  // STRICT: Travelers should ONLY ever see APPROVED stays (never SNOOZED, DELISTED, or PENDING)
  const where = {
    status: "APPROVED",
  };

  // 1. Property Type (Category) Filter
  if (propertyType && propertyType.trim() && propertyType.toUpperCase() !== "ALL") {
    where.propertyType = propertyType.trim().toUpperCase();
  }

  // 2. Search by destination or city
  const locationSearch = (destination || city || "").trim();
  if (locationSearch) {
    const searchTerms = locationSearch
      .split(/[,\s]+/)
      .map((term) => term.trim())
      .filter(Boolean);

    where.OR = searchTerms.flatMap((term) => [
      { city: { contains: term, mode: "insensitive" } },
      { state: { contains: term, mode: "insensitive" } },
      { country: { contains: term, mode: "insensitive" } },
      { title: { contains: term, mode: "insensitive" } },
      { address: { contains: term, mode: "insensitive" } },
    ]);
  }

  // 3. Price Filter
  if (minPrice || maxPrice) {
    where.pricePerNight = {};
    if (minPrice) where.pricePerNight.gte = parseFloat(minPrice);
    if (maxPrice) where.pricePerNight.lte = parseFloat(maxPrice);
  }

  // 4. Guest Count Filter
  if (guests) {
    where.guests = {
      gte: parseInt(guests, 10),
    };
  }

  const take = parseInt(limit, 10);
  const skip = (parseInt(page, 10) - 1) * take;

  const now = new Date();
  const checkInDate = checkIn ? new Date(checkIn) : null;
  const checkOutDate = checkOut ? new Date(checkOut) : null;
  const hasDateFilter =
    checkInDate &&
    checkOutDate &&
    !isNaN(checkInDate.getTime()) &&
    !isNaN(checkOutDate.getTime());

  const includeQuery = {
    images: true,
    amenities: {
      include: { amenity: true },
    },
    host: {
      select: { id: true, name: true, avatar: true },
    },
    _count: {
      select: { reviews: true },
    },
  };

  if (hasDateFilter) {
    includeQuery.bookings = {
      where: {
        OR: [
          { status: "CONFIRMED" },
          {
            status: "HOLD",
            holdExpiresAt: { gt: now },
          },
        ],
        checkIn: { lt: checkOutDate },
        checkOut: { gt: checkInDate },
      },
      select: {
        id: true,
        checkIn: true,
        checkOut: true,
        status: true,
      },
    };
  }

  const [total, properties] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: includeQuery,
    }),
  ]);

  const formattedProperties = properties.map((prop) => {
    const isBookedForDates =
      hasDateFilter && Array.isArray(prop.bookings) && prop.bookings.length > 0;

    return {
      ...prop,
      isDateLocked: isBookedForDates,
      lockReason: isBookedForDates ? "Reserved for your selected dates" : null,
    };
  });

  return {
    total,
    page: parseInt(page, 10),
    totalPages: Math.ceil(total / take),
    properties: formattedProperties,
  };
};

export const getPropertyById = async (propertyId) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      images: true,
      amenities: {
        include: { amenity: true },
      },
      host: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          createdAt: true,
        },
      },
      reviews: {
        where: {
          isPublished: true, // Only show approved reviews
        },
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!property) {
    throw new Error("Property not found");
  }

  // If a property is delisted, travelers cannot view it
  if (property.status === "DELISTED") {
    throw new Error("This listing has been permanently delisted.");
  }

  return property;
};

export const getHostProperties = async (hostId) => {
  // Exclude delisted properties safely via raw SQL to avoid enum validation mismatch
  return await prisma.$queryRawUnsafe(
    `SELECT 
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
    ORDER BY p."createdAt" DESC`,
    hostId
  );
};