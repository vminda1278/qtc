const { saveSiteSettingsModel, getSiteSettingsModel } = require('../model/admin');
const express = require('express');

const dotenv = require("dotenv");
dotenv.config();

/**
 * Save site settings for an enterprise
 * POST /v1/admin/saveSiteSettings
 * 
 * Expected body:
 * {
 *   email: "enterprise@example.com",
 *   siteSettings: { ...settings data... }
 * }
 */
const saveSiteSettings = async (req, res, next) => {
    try {
        console.log('[DEBUG] saveSiteSettings request body:', JSON.stringify(req.body, null, 2));

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

        await saveSiteSettingsModel({ email, siteSettings });

        res.status(200).json({
            status: 'success',
            message: 'Site settings saved successfully',
            data: {
                email,
                savedAt: new Date().toISOString()
            }
        });

    } catch (e) {
        console.error('Error in saveSiteSettings:', e);
        const statusCode = e.$metadata && e.$metadata.httpStatusCode ? e.$metadata.httpStatusCode : 500;
        res.status(statusCode).json({
            status: 'error',
            message: e.message || 'Failed to save site settings'
        });
        next(e);
    }
};

/**
 * Get site settings for an enterprise
 * GET /v1/admin/getSiteSettings?email=enterprise@example.com
 */
const getSiteSettings = async (req, res, next) => {
    try {
        console.log('[DEBUG] getSiteSettings query params:', req.query);

        const { email } = req.query;

        if (!email) {
            return res.status(400).json({
                status: 'error',
                message: 'email is required as query parameter'
            });
        }

        const siteSettings = await getSiteSettingsModel({ email });

        if (!siteSettings) {
            return res.status(404).json({
                status: 'error',
                message: 'Site settings not found for this enterprise'
            });
        }

        res.status(200).json({
            status: 'success',
            data: siteSettings
        });

    } catch (e) {
        console.error('Error in getSiteSettings:', e);
        const statusCode = e.$metadata && e.$metadata.httpStatusCode ? e.$metadata.httpStatusCode : 500;
        res.status(statusCode).json({
            status: 'error',
            message: e.message || 'Failed to get site settings'
        });
        next(e);
    }
};

// Create Express router
const adminRouter = express.Router();

adminRouter.post('/saveSiteSettings', saveSiteSettings);
adminRouter.get('/getSiteSettings', getSiteSettings);

module.exports = {
    saveSiteSettings,
    getSiteSettings,
    adminRouter
};
