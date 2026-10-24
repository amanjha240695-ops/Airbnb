import prisma from "../config/db.js";

export const addReview = async (userId, reviewData) => {
  const { bookingId, rating, comment } = reviewData;

  if (!bookingId || rating === undefined || rating === null) {
    throw new Error("bookingId and rating (1-5) are required");
  }

  const numericRating = parseInt(rating, 10);
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    throw new Error("Rating must be an integer between 1 and 5");
  }

  // 1. Fetch booking
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  // 2. Ensure only the guest who made the booking can review it
  if (booking.userId !== userId) {
    throw new Error("You are not authorized to review this booking");
  }

  // 3. Ensure booking was paid/confirmed or completed
  if (booking.status !== "CONFIRMED" && booking.status !== "COMPLETED") {
    throw new Error("Reviews are only permitted for confirmed or completed bookings");
  }

  // 4. Prevent duplicate reviews (schema enforces unique bookingId on Review)
  const existingReview = await prisma.review.findUnique({
    where: { bookingId },
  });

  if (existingReview) {
    throw new Error("You have already reviewed this booking");
  }

  // 5. Create Review
  const review = await prisma.review.create({
    data: {
      rating: numericRating,
      comment: comment ? comment.trim() : null,
      bookingId,
      userId,
      propertyId: booking.propertyId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      property: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return review;
};

export const getPropertyReviews = async (propertyId) => {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!property) {
    throw new Error("Property not found");
  }

  const reviews = await prisma.review.findMany({
    where: { propertyId },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  });

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? parseFloat((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(2))
      : 0;

  return {
    propertyId,
    totalReviews,
    averageRating,
    reviews,
  };
};