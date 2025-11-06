const { saveDraftSiteSettingsModel, getDraftSiteSettingsModel, publishSiteSettingsModel, getLiveSiteSettingsModel } = require('../model/admin');
const express = require('express');
const jwt = require('jsonwebtoken');

const dotenv = require("dotenv");
dotenv.config();

/**
 * Middleware to extract user email from JWT token
 */
const extractUserFromToken = (req, res, next) => {
    try {
        let token = req.headers['x-access-token'] || req.headers['authorization'];
        
        console.log('[DEBUG] Raw token header:', token);
        
        if (token && token.startsWith('Bearer ')) {
            token = token.slice(7, token.length);
        }
        
        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'Authentication token required'
            });
        }
        
        console.log('[DEBUG] Token after Bearer strip:', token);
        
        // Decode token (you can verify it here if needed)
        const decoded = jwt.decode(token);
        
        console.log('[DEBUG] Decoded token:', decoded);
        
        if (!decoded || !decoded.email) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid token or email not found'
            });
        }
        
        // Attach email to request object
        req.userEmail = decoded.email;
        console.log('[DEBUG] User email extracted:', req.userEmail);
        next();
    } catch (error) {
        console.error('Error extracting user from token:', error);
        return res.status(401).json({
            status: 'error',
            message: 'Failed to authenticate token'
        });
    }
};

/**
 * Save draft site settings for an enterprise
 * POST /v1/admin/saveDraftSiteSettings
 * 
 * Expected body:
 * {
 *   siteSettings: { ...settings data... }
 * }
 * Email is extracted from JWT token
 */
const saveDraftSiteSettings = async (req, res, next) => {
    try {
        console.log('[DEBUG] saveDraftSiteSettings request body:', JSON.stringify(req.body, null, 2));
        console.log('[DEBUG] User email from token:', req.userEmail);

        if (!req.body.siteSettings || typeof req.body.siteSettings !== 'object') {
            return res.status(400).json({
                status: 'error',
                message: 'siteSettings must be a valid object in request body'
            });
        }

        const email = req.userEmail; // Get email from token
        const { siteSettings } = req.body;

        await saveDraftSiteSettingsModel({ email, siteSettings });

        res.status(200).json({
            status: 'success',
            message: 'Draft site settings saved successfully',
            data: {
                email,
                savedAt: new Date().toISOString()
            }
        });

    } catch (e) {
        console.error('Error in saveDraftSiteSettings:', e);
        const statusCode = e.$metadata && e.$metadata.httpStatusCode ? e.$metadata.httpStatusCode : 500;
        res.status(statusCode).json({
            status: 'error',
            message: e.message || 'Failed to save draft site settings'
        });
        next(e);
    }
};

/**
 * Get draft site settings for an enterprise
 * GET /v1/admin/getDraftSiteSettings
 * Email is extracted from JWT token
 */
const getDraftSiteSettings = async (req, res, next) => {
    try {
        const email = req.userEmail; // Get email from token
        console.log('[DEBUG] getDraftSiteSettings for email:', email);

        const siteSettings = await getDraftSiteSettingsModel({ email });

        if (!siteSettings) {
            return res.status(404).json({
                status: 'error',
                message: 'Draft site settings not found for this enterprise'
            });
        }

        res.status(200).json({
            status: 'success',
            data: siteSettings
        });

    } catch (e) {
        console.error('Error in getDraftSiteSettings:', e);
        const statusCode = e.$metadata && e.$metadata.httpStatusCode ? e.$metadata.httpStatusCode : 500;
        res.status(statusCode).json({
            status: 'error',
            message: e.message || 'Failed to get draft site settings'
        });
        next(e);
    }
};

/**
 * Publish site settings for an enterprise (make them live)
 * POST /v1/admin/publishSiteSettings
 * 
 * Expected body:
 * {
 *   subdomain: "brighttax",
 *   siteSettings: { ...settings data... }
 * }
 * Email is extracted from JWT token
 */
const publishSiteSettings = async (req, res, next) => {
    try {
        console.log('[DEBUG] publishSiteSettings request body:', JSON.stringify(req.body, null, 2));

        const email = req.userEmail; // Get email from token

        if (!req.body.subdomain) {
            return res.status(400).json({
                status: 'error',
                message: 'subdomain is required in request body'
            });
        }

        if (!req.body.siteSettings || typeof req.body.siteSettings !== 'object') {
            return res.status(400).json({
                status: 'error',
                message: 'siteSettings must be a valid object in request body'
            });
        }

        const { subdomain, siteSettings } = req.body;

        await publishSiteSettingsModel({ email, subdomain, siteSettings });

        res.status(200).json({
            status: 'success',
            message: 'Site settings published successfully',
            data: {
                email,
                subdomain,
                publishedAt: new Date().toISOString()
            }
        });

    } catch (e) {
        console.error('Error in publishSiteSettings:', e);
        const statusCode = e.$metadata && e.$metadata.httpStatusCode ? e.$metadata.httpStatusCode : 500;
        res.status(statusCode).json({
            status: 'error',
            message: e.message || 'Failed to publish site settings'
        });
        next(e);
    }
};

/**
 * Get live site settings for an enterprise
 * GET /v1/admin/getLiveSiteSettings
 * Email is extracted from JWT token
 */
const getLiveSiteSettings = async (req, res, next) => {
    try {
        const email = req.userEmail; // Get email from token
        console.log('[DEBUG] getLiveSiteSettings for email:', email);

        const siteSettings = await getLiveSiteSettingsModel({ email });

        if (!siteSettings) {
            return res.status(404).json({
                status: 'error',
                message: 'Live site settings not found for this enterprise'
            });
        }

        res.status(200).json({
            status: 'success',
            data: siteSettings
        });

    } catch (e) {
        console.error('Error in getLiveSiteSettings:', e);
        const statusCode = e.$metadata && e.$metadata.httpStatusCode ? e.$metadata.httpStatusCode : 500;
        res.status(statusCode).json({
            status: 'error',
            message: e.message || 'Failed to get live site settings'
        });
        next(e);
    }
};

// Create Express router
const adminRouter = express.Router();

// Apply extractUserFromToken middleware to all admin routes
adminRouter.use(extractUserFromToken);

adminRouter.post('/saveDraftSiteSettings', saveDraftSiteSettings);
adminRouter.get('/getDraftSiteSettings', getDraftSiteSettings);
adminRouter.post('/publishSiteSettings', publishSiteSettings);
adminRouter.get('/getLiveSiteSettings', getLiveSiteSettings);

module.exports = {
    saveDraftSiteSettings,
    getDraftSiteSettings,
    publishSiteSettings,
    getLiveSiteSettings,
    adminRouter
};
