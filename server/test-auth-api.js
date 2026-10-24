const BASE_URL = "http://localhost:5000/api/auth";
const testEmail = "apitest@example.com";

async function runTest() {
  try {
    console.log("1. Sending POST /request-otp...");
    const reqOtpRes = await fetch(`${BASE_URL}/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail }),
    });
    const reqOtpData = await reqOtpRes.json();
    console.log("Request OTP Response:", reqOtpData);

    if (!reqOtpData.success) {
      throw new Error(`Request OTP failed: ${reqOtpData.message}`);
    }

    // Since our otpService logs the code to console, let's fetch it directly from DB for verification
    const { default: prisma } = await import("./src/config/db.js");
    const activeOtp = await prisma.oTP.findFirst({
      where: { email: testEmail, isUsed: false },
      orderBy: { createdAt: "desc" },
    });

    console.log("2. Sending POST /verify-otp with code:", activeOtp.code);
    const verifyRes = await fetch(`${BASE_URL}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, code: activeOtp.code }),
    });
    const verifyData = await verifyRes.json();
    console.log("Verify OTP Response:", verifyData);

    if (!verifyData.success) {
      throw new Error(`Verify OTP failed: ${verifyData.message}`);
    }

    const token = verifyData.data.token;

    console.log("3. Sending GET /me with Bearer token...");
    const meRes = await fetch(`${BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meData = await meRes.json();
    console.log("Get Me Response:", meData);

    if (!meData.success) {
      throw new Error(`Get Me failed: ${meData.message}`);
    }

    console.log("\n==========================================");
    console.log("ALL AUTH REST API ENDPOINTS TESTED AND PASSED!");
    console.log("==========================================");

    await prisma.$disconnect();
  } catch (error) {
    console.error("API TEST ERROR:", error);
  }
}

runTest();