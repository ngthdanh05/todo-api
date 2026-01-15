import express from "express";

import { sendVerificationCode } from "../controllers/auth/sendVerificationCode";
import { verifyVerificationCode } from "../controllers/auth/verifyVerificationCode";
import { changePassword } from "../controllers/auth/changePassword";
import { identifier } from "../middlewares/identifier";
import { signout } from "../controllers/auth/signout";
import { sendForgotPasswordCode } from "../controllers/auth/sendForgotPasswordCode";
import { validate } from "../controllers/auth/validate";
import { CheckForgotPasswordCode } from "../controllers/auth/checkForgotPasswordCode";
import { resetPasswordWithCode } from "../controllers/auth/resetPasswordWithCode";
import { signup } from "../controllers/auth/signup";
import { signin } from "../controllers/auth/signin";
const router = express.Router();

router.get("/validate", identifier, (req, res, next) => {
  Promise.resolve(validate(req, res, next)).catch(next);
});
router.post("/signup", signup);
router.post("/signin", signin);
router.post("/signout", identifier, signout);

router.patch("/send-verification-code", identifier, sendVerificationCode);

router.patch("/verify-verification-code", identifier, verifyVerificationCode);

router.patch("/change-password", identifier, changePassword);

router.patch("/send-forgot-password-code", sendForgotPasswordCode);

router.patch("/check-forgot-password-code", CheckForgotPasswordCode);

router.patch("/reset-password-with-code", resetPasswordWithCode);

export default router;
