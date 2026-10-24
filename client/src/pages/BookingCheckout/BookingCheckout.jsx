import React, { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  createBookingApi,
  createPaymentOrderApi,
  verifyPaymentApi,
} from "../../services/bookingApi";
import "./BookingCheckout.css";

export default function BookingCheckout() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Booking details passed via router state from PropertyDetails
  const stateData = location.state || {};
  const {
    checkIn,
    checkOut,
    guests = 1,
    nights = 1,
    totalAmount = 0,
    property,
  } = stateData;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Guard against direct URL visits without selecting dates
  if (!property || !checkIn || !checkOut) {
    return (
      <div className="checkout-container">
        <div className="checkout-missing">
          <h2>No booking details selected</h2>
          <p>Please return to the property page and select your stay dates first.</p>
          <button
            type="button"
            className="checkout-native-btn"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const coverImage =
    property.images?.[0]?.url ||
    property.images?.[0] ||
    "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80";

  const pricePerNight = Number(property.pricePerNight);
  const cleaningFee = Number(property.cleaningFee || 0);
  const serviceFee = Number(property.serviceFee || 0);
  const subtotal = pricePerNight * nights;

  const handleConfirmAndPay = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Verify Razorpay script is present
      if (!window.Razorpay) {
        throw new Error("Razorpay SDK is loading or blocked. Please check your internet or adblocker.");
      }

      // Safe Property ID resolution (either from route param or property object)
      const targetPropertyId = id || property?.id || property?._id;
      if (!targetPropertyId) {
        throw new Error("Property identifier is missing. Please go back and select the property again.");
      }

      // 2. Prepare clean booking payload
      const bookingPayload = {
        propertyId: targetPropertyId,
        checkIn: new Date(checkIn).toISOString(),
        checkOut: new Date(checkOut).toISOString(),
        guests: Number(guests) || 1,
        nights: Number(nights) || 1,
        pricePerNight,
        subtotal,
        cleaningFee,
        serviceFee,
        totalAmount: Number(totalAmount),
      };

      console.log("Submitting booking intent:", bookingPayload);

      // 3. Create the booking record safely
      let bookingRes;
      try {
        bookingRes = await createBookingApi(bookingPayload);
      } catch (createErr) {
        const serverMsg =
          createErr.response?.data?.message ||
          createErr.response?.data?.error ||
          createErr.message ||
          "Could not initialize booking in database.";
        throw new Error(serverMsg);
      }

      // Safe extraction supporting all possible backend envelope shapes
      const createdBooking =
        bookingRes?.data?.data?.booking ||
        bookingRes?.data?.booking ||
        bookingRes?.data?.data ||
        bookingRes?.booking ||
        bookingRes?.data;

      const bookingId =
        createdBooking?.id ||
        createdBooking?._id ||
        bookingRes?.data?.id ||
        bookingRes?.id;

      if (!bookingId) {
        const failReason =
          bookingRes?.data?.message ||
          "Backend did not return a valid booking ID.";
        throw new Error(failReason);
      }

      console.log("Booking created with ID:", bookingId);

      // 4. Create Razorpay order via backend
      let orderRes;
      try {
        orderRes = await createPaymentOrderApi(bookingId);
      } catch (orderErr) {
        const orderFailMsg =
          orderErr.response?.data?.message ||
          orderErr.response?.data?.error ||
          orderErr.message ||
          "Failed to generate payment gateway order.";
        throw new Error(orderFailMsg);
      }

      const orderData =
        orderRes?.data?.data ||
        orderRes?.data ||
        orderRes;

      const { orderId, amount, currency, keyId } = orderData || {};

      if (!orderId || !keyId) {
        throw new Error(
          orderRes?.data?.message || "Payment gateway credentials missing from server."
        );
      }

      // 5. Open Razorpay modal inside React
      const options = {
        key: keyId,
        amount: amount,
        currency: currency || "INR",
        name: "Airbnb Stay Reservation",
        description: `Booking #${bookingId}`,
        image: coverImage,
        order_id: orderId,
        handler: async function (response) {
          try {
            setLoading(true);

            // Safe fallback for order_id
            const verificationPayload = {
              bookingId,
              razorpayOrderId: response.razorpay_order_id || orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            };

            console.log("Verifying payment with backend:", verificationPayload);

            const verifyRes = await verifyPaymentApi(verificationPayload);

            const isSuccess =
              verifyRes?.data?.success === true ||
              verifyRes?.success === true ||
              verifyRes?.status === 200 ||
              Boolean(verifyRes?.data?.data?.booking || verifyRes?.data?.booking);

            if (isSuccess) {
              const confirmedData =
                verifyRes?.data?.data?.booking ||
                verifyRes?.data?.booking ||
                createdBooking;

              navigate(`/booking/status/${bookingId}`, {
                replace: true,
                state: {
                  booking: confirmedData,
                  property,
                  paymentId: response.razorpay_payment_id,
                },
              });
            } else {
              throw new Error(
                verifyRes?.data?.message || "Payment signature verification failed."
              );
            }
          } catch (err) {
            console.error("Verification error caught:", err);
            setError(
              err.response?.data?.message ||
              err.message ||
              "Payment verification failed."
            );
            setLoading(false);
          }
        },
        prefill: {
          name: "Guest Traveller",
          email: "guest@example.com",
          contact: "9876543210",
        },
        theme: {
          color: "#ff385c",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        setError(`Payment Failed: ${response.error?.description || "Transaction cancelled"}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error("Booking Checkout Error:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to process booking"
      );
      setLoading(false);
    }
  };

  return (
    <div className="checkout-container">
      <div className="checkout-back-nav" onClick={() => navigate(-1)}>
        <span>←</span>
        <span>Confirm and pay</span>
      </div>

      <div className="checkout-layout">
        {/* Left Column: Trip Overview */}
        <div className="checkout-left">
          {error && <div className="checkout-error-banner">{error}</div>}

          <section className="checkout-section">
            <h3 className="section-title">Your trip</h3>

            <div className="trip-item">
              <div>
                <h4>Dates</h4>
                <p>
                  {new Date(checkIn).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  –{" "}
                  {new Date(checkOut).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="trip-item">
              <div>
                <h4>Guests</h4>
                <p>
                  {guests} guest{guests > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </section>

          <hr className="checkout-divider" />

          {/* Payment Method Selector */}
          <section className="checkout-section">
            <h3 className="section-title">Pay with</h3>
            <div className="payment-card-box active">
              <div className="payment-method-row">
                <div className="method-left">
                  <span className="method-icon">💳</span>
                  <div>
                    <strong>Razorpay Secure Gateway</strong>
                    <p>UPI, Credit/Debit Cards, NetBanking</p>
                  </div>
                </div>
                <input type="radio" checked readOnly />
              </div>
            </div>
          </section>

          <hr className="checkout-divider" />

          {/* Policy Section */}
          <section className="checkout-section">
            <h3 className="section-title">Cancellation policy</h3>
            <p className="policy-note">
              Free cancellation up to 48 hours before check-in. Review house rules provided by the host prior to arrival.
            </p>
          </section>

          <div className="checkout-btn-wrapper">
            <button
              type="button"
              className="checkout-pay-button"
              disabled={loading}
              onClick={handleConfirmAndPay}
            >
              {loading
                ? "Opening Razorpay..."
                : `Pay ₹${Number(totalAmount).toLocaleString("en-IN")}`}
            </button>
          </div>
        </div>

        {/* Right Column: Sticky Property Summary */}
        <div className="checkout-right">
          <div className="summary-card">
            <div className="summary-property-header">
              <img
                src={coverImage}
                alt={property.title}
                className="summary-thumb"
              />
              <div className="summary-property-meta">
                <span className="summary-room-type">{property.propertyType}</span>
                <h4 className="summary-title">{property.title}</h4>
                <span className="summary-rating">★ 5.0 (Guest Favorite)</span>
              </div>
            </div>

            <hr className="checkout-divider" />

            <h4 className="price-details-heading">Price details</h4>

            <div className="summary-price-breakdown">
              <div className="summary-price-row">
                <span>
                  ₹{pricePerNight.toLocaleString("en-IN")} × {nights} night
                  {nights > 1 ? "s" : ""}
                </span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="summary-price-row">
                <span>Cleaning fee</span>
                <span>₹{cleaningFee.toLocaleString("en-IN")}</span>
              </div>
              <div className="summary-price-row">
                <span>Airbnb service fee</span>
                <span>₹{serviceFee.toLocaleString("en-IN")}</span>
              </div>
              <hr className="checkout-divider" />
              <div className="summary-price-row summary-total-row">
                <span>Total (INR)</span>
                <span>₹{Number(totalAmount).toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}