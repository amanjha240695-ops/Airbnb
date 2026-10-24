import {
  createBooking,
  getUserBookings,
  cancelBooking,
  getPropertyLockedDates,
} from "../services/bookingService.js";
import { successResponse, errorResponse } from "../utils/response.js";

// Fetch locked & confirmed dates for a property
export const getLockedDates = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const lockedDates = await getPropertyLockedDates(propertyId);
    return successResponse(res, 200, "Locked dates retrieved successfully", { lockedDates });
  } catch (error) {
    console.error("getLockedDates error:", error);
    return errorResponse(res, 400, error.message);
  }
};

export const makeBooking = async (req, res, next) => {
  try {
    console.log("Incoming Booking Payload:", req.body);
    console.log("Logged In User ID:", req.user?.id);

    const { propertyId, checkIn, checkOut, guests } = req.body;

    if (!propertyId || !checkIn || !checkOut) {
      return errorResponse(res, 400, "Property ID, check-in, and check-out dates are required");
    }

    // Handle guests whether sent as number, string, or object { adults, children }
    let parsedGuests = 1;
    if (typeof guests === "object" && guests !== null) {
      parsedGuests = (Number(guests.adults) || 1) + (Number(guests.children) || 0);
    } else if (guests) {
      parsedGuests = parseInt(guests, 10) || 1;
    }

    const booking = await createBooking(req.user.id, {
      propertyId,
      checkIn,
      checkOut,
      guests: parsedGuests,
    });

    return successResponse(res, 201, "Booking initialized successfully", { booking });
  } catch (error) {
    console.error("makeBooking Error:", error);
    return errorResponse(res, 400, error.message || "Failed to initialize booking");
  }
};

export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await getUserBookings(req.user.id);
    return successResponse(res, 200, "User bookings retrieved", { bookings });
  } catch (error) {
    console.error("getMyBookings error:", error);
    return errorResponse(res, 400, error.message);
  }
};

export const cancelMyBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = "Guest requested cancellation" } = req.body || {};

    const cancelled = await cancelBooking(req.user.id, id, reason);
    return successResponse(res, 200, "Booking cancelled successfully", { booking: cancelled });
  } catch (error) {
    console.error("cancelMyBooking error:", error);
    return errorResponse(res, 400, error.message);
  }
};