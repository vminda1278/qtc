const { putItem, getItem } = require("../utility/db");

/**
 * Save site settings for an enterprise
 * 
 * @param {Object} params - Function parameters
 * @param {string} params.email - Enterprise email
 * @param {Object} params.siteSettings - Site settings data to save
 * @returns {Promise<Object>} - DynamoDB response
 * @throws {Error} If required parameters are missing or save fails
 */
async function saveSiteSettingsModel({ email, siteSettings }) {
    try {
        if (!email) {
            throw new Error("email is required");
        }

        if (!siteSettings || typeof siteSettings !== 'object') {
            throw new Error("siteSettings must be a valid object");
        }

        const params = {
            pk: `Enterprise:${email}`,
            sk: "SiteSettings:Draft",
            attr: {
                ATTR1: siteSettings
            }
        };

        console.log('[DEBUG] Saving site settings:', JSON.stringify(params, null, 2));
        
        const response = await putItem(params);
        
        console.log('[DEBUG] Site settings saved successfully');
        return response;

    } catch (e) {
        console.error('Error in saveSiteSettingsModel:', e);
        throw new Error(e.message || 'Failed to save site settings');
    }
}

/**
 * Get site settings for an enterprise
 * 
 * @param {Object} params - Function parameters
 * @param {string} params.email - Enterprise email
 * @returns {Promise<Object>} - Site settings data
 * @throws {Error} If required parameters are missing or get fails
 */
async function getSiteSettingsModel({ email }) {
    try {
        if (!email) {
            throw new Error("email is required");
        }

        const params = {
            pk: `Enterprise:${email}`,
            sk: "SiteSettings:Draft"
        };

        console.log('[DEBUG] Getting site settings:', JSON.stringify(params, null, 2));
        
        const response = await getItem(params);
        
        if (!response.Item) {
            return null;
        }

        console.log('[DEBUG] Site settings retrieved successfully');
        return response.Item.ATTR1;

    } catch (e) {
        console.error('Error in getSiteSettingsModel:', e);
        throw new Error(e.message || 'Failed to get site settings');
    }
}

module.exports = {
    saveSiteSettingsModel,
    getSiteSettingsModel
};
