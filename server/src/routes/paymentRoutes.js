import { Router } from "express";
import { createOrder, verifyPayment } from "../controllers/paymentController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticate);

router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);

export default router;