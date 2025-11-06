const { putItem, getItem, transactWriteItems } = require("../utility/db");

/**
 * Save draft site settings for an enterprise
 * 
 * @param {Object} params - Function parameters
 * @param {string} params.email - Enterprise email
 * @param {Object} params.siteSettings - Site settings data to save
 * @returns {Promise<Object>} - DynamoDB response
 * @throws {Error} If required parameters are missing or save fails
 */
async function saveDraftSiteSettingsModel({ email, siteSettings }) {
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

        console.log('[DEBUG] Saving draft site settings:', JSON.stringify(params, null, 2));
        
        const response = await putItem(params);
        
        console.log('[DEBUG] Draft site settings saved successfully');
        return response;

    } catch (e) {
        console.error('Error in saveDraftSiteSettingsModel:', e);
        throw new Error(e.message || 'Failed to save draft site settings');
    }
}

/**
 * Get draft site settings for an enterprise
 * 
 * @param {Object} params - Function parameters
 * @param {string} params.email - Enterprise email
 * @returns {Promise<Object>} - Site settings data
 * @throws {Error} If required parameters are missing or get fails
 */
async function getDraftSiteSettingsModel({ email }) {
    try {
        if (!email) {
            throw new Error("email is required");
        }

        const params = {
            pk: `Enterprise:${email}`,
            sk: "SiteSettings:Draft"
        };

        console.log('[DEBUG] Getting draft site settings:', JSON.stringify(params, null, 2));
        
        const response = await getItem(params);
        
        if (!response.Item) {
            return null;
        }

        console.log('[DEBUG] Draft site settings retrieved successfully');
        return response.Item.ATTR1;

    } catch (e) {
        console.error('Error in getDraftSiteSettingsModel:', e);
        throw new Error(e.message || 'Failed to get draft site settings');
    }
}

/**
 * Publish site settings for an enterprise (make them live)
 * 
 * @param {Object} params - Function parameters
 * @param {string} params.email - Enterprise email
 * @param {string} params.subdomain - Subdomain name (e.g., "brighttax")
 * @param {Object} params.siteSettings - Site settings data to publish
 * @returns {Promise<Object>} - DynamoDB response
 * @throws {Error} If required parameters are missing or save fails
 */
async function publishSiteSettingsModel({ email, subdomain, siteSettings }) {
    try {
        if (!email) {
            throw new Error("email is required");
        }

        if (!subdomain) {
            throw new Error("subdomain is required");
        }

        if (!siteSettings || typeof siteSettings !== 'object') {
            throw new Error("siteSettings must be a valid object");
        }

        console.log('[DEBUG] Publishing live site settings for email:', email, 'subdomain:', subdomain);

        // Prepare transaction items to write to both locations
        const transactItems = [
            {
                op: "add",
                pk: `Enterprise:${email}`,
                sk: "SiteSettings:Live",
                attr: {
                    ATTR1: siteSettings
                }
            },
            {
                op: "add",
                pk: "LiveSites",
                sk: subdomain,
                attr: {
                    ATTR1: siteSettings,
                    ATTR2: email // Store email for reference
                }
            }
        ];

        console.log('[DEBUG] Publishing to two locations:', JSON.stringify(transactItems, null, 2));
        
        const response = await transactWriteItems(transactItems);
        
        console.log('[DEBUG] Live site settings published successfully to both locations');
        return response;

    } catch (e) {
        console.error('Error in publishSiteSettingsModel:', e);
        throw new Error(e.message || 'Failed to publish site settings');
    }
}

/**
 * Get live site settings for an enterprise
 * 
 * @param {Object} params - Function parameters
 * @param {string} params.email - Enterprise email
 * @returns {Promise<Object>} - Site settings data
 * @throws {Error} If required parameters are missing or get fails
 */
async function getLiveSiteSettingsModel({ email }) {
    try {
        if (!email) {
            throw new Error("email is required");
        }

        const params = {
            pk: `Enterprise:${email}`,
            sk: "SiteSettings:Live"
        };

        console.log('[DEBUG] Getting live site settings:', JSON.stringify(params, null, 2));
        
        const response = await getItem(params);
        
        if (!response.Item) {
            return null;
        }

        console.log('[DEBUG] Live site settings retrieved successfully');
        return response.Item.ATTR1;

    } catch (e) {
        console.error('Error in getLiveSiteSettingsModel:', e);
        throw new Error(e.message || 'Failed to get live site settings');
    }
}

/**
 * Get site settings by subdomain (public lookup)
 * Subdomain is extracted from full domain (e.g., "brighttax" from "brighttax.qwiktax.in")
 * 
 * @param {Object} params - Function parameters
 * @param {string} params.subdomain - Subdomain name (e.g., "brighttax")
 * @returns {Promise<Object>} - Site settings data
 * @throws {Error} If required parameters are missing or get fails
 */
async function getSiteSettingsBySubdomainModel({ subdomain }) {
    try {
        if (!subdomain) {
            throw new Error("subdomain is required");
        }

        const params = {
            pk: "LiveSites",
            sk: subdomain
        };

        console.log('[DEBUG] Getting site settings by subdomain:', JSON.stringify(params, null, 2));
        
        const response = await getItem(params);
        
        if (!response.Item) {
            return null;
        }

        console.log('[DEBUG] Site settings retrieved successfully for subdomain:', subdomain);
        return response.Item.ATTR1;

    } catch (e) {
        console.error('Error in getSiteSettingsBySubdomainModel:', e);
        throw new Error(e.message || 'Failed to get site settings by subdomain');
    }
}

module.exports = {
    saveDraftSiteSettingsModel,
    getDraftSiteSettingsModel,
    publishSiteSettingsModel,
    getLiveSiteSettingsModel,
    getSiteSettingsBySubdomainModel
};
