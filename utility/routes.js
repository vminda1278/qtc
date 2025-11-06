const express = require('express');
const authController = require('../controller/auth-controller');
const superadminController = require('../controller/superadmin-controller');
const adminController = require('../controller/admin-controller');

// Create a simple router for the root path
const superadminRouter = express.Router();
const authRouter = express.Router();
const adminRouter = express.Router();

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

superadminRouter.post('/confirmuserSignup', superadminController.adminConfirmUserSignUp);
superadminRouter.post('/deleteEnterprise', superadminController.deleteEnterprise);
superadminRouter.get('/getAllEnterprises', superadminController.getAllEnterprises);

// Admin routes
adminRouter.post('/saveSiteSettings', adminController.saveSiteSettings);
adminRouter.get('/getSiteSettings', adminController.getSiteSettings);


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
  adminRouter
};
