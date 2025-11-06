const { saveDraftSiteSettingsModel, getDraftSiteSettingsModel, publishSiteSettingsModel, getLiveSiteSettingsModel } = require('../model/admin');
const express = require('express');

const dotenv = require("dotenv");
dotenv.config();

/**
 * Save draft site settings for an enterprise
 * POST /v1/admin/saveDraftSiteSettings
 * 
 * Expected body:
 * {
 *   email: "enterprise@example.com",
 *   siteSettings: { ...settings data... }
 * }
 */
const saveDraftSiteSettings = async (req, res, next) => {
    try {
        console.log('[DEBUG] saveDraftSiteSettings request body:', JSON.stringify(req.body, null, 2));

        if (!req.body || !req.body.email) {
            return res.status(400).json({
                status: 'error',
                message: 'email is required in request body'
            });
        }

        if (!req.body.siteSettings || typeof req.body.siteSettings !== 'object') {
            return res.status(400).json({
                status: 'error',
                message: 'siteSettings must be a valid object in request body'
            });
        }

        const { email, siteSettings } = req.body;

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
 * GET /v1/admin/getDraftSiteSettings?email=enterprise@example.com
 */
const getDraftSiteSettings = async (req, res, next) => {
    try {
        console.log('[DEBUG] getDraftSiteSettings query params:', req.query);

        const { email } = req.query;

        if (!email) {
            return res.status(400).json({
                status: 'error',
                message: 'email is required as query parameter'
            });
        }

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
 *   email: "enterprise@example.com",
 *   subdomain: "brighttax",
 *   siteSettings: { ...settings data... }
 * }
 */
const publishSiteSettings = async (req, res, next) => {
    try {
        console.log('[DEBUG] publishSiteSettings request body:', JSON.stringify(req.body, null, 2));

        if (!req.body || !req.body.email) {
            return res.status(400).json({
                status: 'error',
                message: 'email is required in request body'
            });
        }

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

        const { email, subdomain, siteSettings } = req.body;

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
 * GET /v1/admin/getLiveSiteSettings?email=enterprise@example.com
 */
const getLiveSiteSettings = async (req, res, next) => {
    try {
        console.log('[DEBUG] getLiveSiteSettings query params:', req.query);

        const { email } = req.query;

        if (!email) {
            return res.status(400).json({
                status: 'error',
                message: 'email is required as query parameter'
            });
        }

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
