const express = require('express');
const authController = require('../controller/auth-controller');
const superadminController = require('../controller/superadmin-controller');
const adminController = require('../controller/admin-controller');
const publicController = require('../controller/public-controller');

// Create a simple router for the root path
const superadminRouter = express.Router();
const authRouter = express.Router();
// Use adminRouter from admin-controller (includes JWT middleware)
const adminRouter = adminController.adminRouter;
const publicRouter = express.Router();

// Retailer router removed; all endpoints consolidated under LSP router

authRouter.post('/signup', authController.userSignUp);
authRouter.post('/confirm', authController.confirmUserSignUp);
authRouter.post('/login', authController.initiateUserAuth);
authRouter.post('/forgot-password', authController.forgotUserPassword);
authRouter.post('/confirm-forgot-password', authController.confirmUserForgotPassword);
authRouter.post('/resend-code', authController.resendVerificationCode);
authRouter.post('/sendOTP', authController.sendUserOTP);
authRouter.post('/verifyOTP', authController.verifyUserOTP);
authRouter.post('/validate-token', authController.validateAWSToken);
authRouter.post('/google', authController.googleOAuth);

superadminRouter.post('/confirmuserSignup', superadminController.adminConfirmUserSignUp);
superadminRouter.post('/deleteEnterprise', superadminController.deleteEnterprise);
superadminRouter.get('/getAllEnterprises', superadminController.getAllEnterprises);

// Admin routes - already configured in admin-controller with JWT middleware
// No need to redefine routes here, they're already in adminRouter

// Public routes (unauthenticated)
publicRouter.get('/site/:subdomain', publicController.getSiteBySubdomain);


// Root router - Just add an info endpoint
superadminRouter.get('/info', (req, res) => {
  res.json({
    name: 'QwikTax API',
    version: '1.0.0',
    endpoints: {
      auth: '/v1/auth'
    }
  });
});

module.exports = {
  superadminRouter,
  authRouter,
  adminRouter,
  publicRouter
};
