const adminModel = require('../model/admin');

/**
 * Get site settings by subdomain (public endpoint)
 * 
 * @route GET /v1/public/site/:subdomain
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getSiteBySubdomain(req, res) {
    try {
        const { subdomain } = req.params;
        
        if (!subdomain) {
            return res.status(400).json({
                success: false,
                message: 'Subdomain parameter is required'
            });
        }

        console.log('[DEBUG] getSiteBySubdomain called with subdomain:', subdomain);

        // Get site settings from database
        const siteSettings = await adminModel.getSiteSettingsBySubdomainModel({ subdomain });

        if (!siteSettings) {
            return res.status(404).json({
                success: false,
                message: 'Site not found for the given subdomain'
            });
        }

        console.log('[DEBUG] Site settings found for subdomain:', subdomain);

        return res.status(200).json({
            success: true,
            data: siteSettings
        });

    } catch (error) {
        console.error('Error in getSiteBySubdomain:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to get site settings',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

module.exports = {
    getSiteBySubdomain
};
