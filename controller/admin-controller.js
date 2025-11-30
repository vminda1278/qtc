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

/**
 * Check if subdomain is available
 * Queries LiveSites table (PK: LiveSites, SK: <subdomain>)
 */
const checkSubdomainAvailability = async (req, res, next) => {
    try {
        const { subdomain } = req.query;

        if (!subdomain) {
            return res.status(400).json({
                status: 'error',
                message: 'Subdomain parameter is required'
            });
        }

        // Validate subdomain format
        const subdomainRegex = /^[a-z0-9-]+$/;
        if (!subdomainRegex.test(subdomain)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid subdomain format. Use only lowercase letters, numbers, and hyphens.'
            });
        }

        if (subdomain.length < 3) {
            return res.status(400).json({
                status: 'error',
                message: 'Subdomain must be at least 3 characters long'
            });
        }

        const email = req.userEmail; // Get email from token
        console.log('[DEBUG] Checking subdomain availability:', subdomain, 'for user:', email);

        // Get user's current live settings to check their current subdomain
        const { getLiveSiteSettingsModel, checkSubdomainModel } = require('../model/admin');
        
        let userCurrentSubdomain = null;
        try {
            const liveSettings = await getLiveSiteSettingsModel({ email });
            if (liveSettings && liveSettings.GeneralSettings) {
                userCurrentSubdomain = liveSettings.GeneralSettings.subdomain;
                console.log('[DEBUG] User current subdomain:', userCurrentSubdomain);
            }
        } catch (error) {
            console.log('[DEBUG] No live settings found for user, checking as new subdomain');
        }

        // If the subdomain is the same as user's current subdomain, it's available for them
        if (userCurrentSubdomain && userCurrentSubdomain === subdomain) {
            console.log('[DEBUG] Subdomain matches user current subdomain - available');
            return res.status(200).json({
                status: 'success',
                available: true,
                message: 'This is your current subdomain'
            });
        }

        // Check if subdomain exists in LiveSites
        const exists = await checkSubdomainModel({ subdomain });

        console.log('[DEBUG] Subdomain exists:', exists);

        res.status(200).json({
            status: 'success',
            available: !exists,
            message: exists ? 'Subdomain is already taken' : 'Subdomain is available'
        });

    } catch (e) {
        console.error('Error in checkSubdomainAvailability:', e);
        const statusCode = e.$metadata && e.$metadata.httpStatusCode ? e.$metadata.httpStatusCode : 500;
        res.status(statusCode).json({
            status: 'error',
            message: e.message || 'Failed to check subdomain availability'
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
// Alias for backward compatibility - frontend calls it "getPublishedSiteSettings"
adminRouter.get('/getPublishedSiteSettings', getLiveSiteSettings);
adminRouter.get('/checkSubdomainAvailability', checkSubdomainAvailability);

module.exports = {
    saveDraftSiteSettings,
    getDraftSiteSettings,
    publishSiteSettings,
    getLiveSiteSettings,
    checkSubdomainAvailability,
    adminRouter
};
