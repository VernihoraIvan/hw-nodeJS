const express = require("express");

const controllers = require("../../contollers/authControllers");
const authenticate = require("../../middleware/authenticate");
const { upload } = require("../../middleware/upload");
const validateBody = require("../../middleware/validateBody");
const { schemas } = require("../../models/userModel");
const sendEmail = require("../../helpers/sendEmail");

const router = express.Router();

router.patch(
  "/avatars",
  authenticate,
  upload.single("avatar"),
  controllers.uploadAvatar
);

router.get("/verify/:verificationToken", controllers.verify);

router.post(
  "/verify",
  validateBody(schemas.verifySchema),
  controllers.reverify
);

router.post(
  "/register",
  validateBody(schemas.registerSchema),
  controllers.register,
  sendEmail
);

router.patch(
  "/subscription",
  authenticate,
  validateBody(schemas.subscriptionSchema),
  controllers.updateSubscriptionContact
);

router.post("/login", validateBody(schemas.loginSchema), controllers.login);
router.get("/current", authenticate, controllers.getCurrent);
router.post("/logout", authenticate, controllers.logOut);

module.exports = router;
