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
 * 
 * Schema: PK: LiveSites, SK: <email>, ATTR1: <subdomain>, ATTR2: <siteSettings>
 * This ensures each email can only have ONE live site
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
                sk: email, // SK is now the email (ensures 1 site per user)
                attr: {
                    ATTR1: subdomain, // Store subdomain in ATTR1
                    ATTR2: siteSettings // Store settings in ATTR2
                }
            }
        ];

        console.log('[DEBUG] Publishing to two locations (new schema - SK=email, ATTR1=subdomain):', JSON.stringify(transactItems, null, 2));
        
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
 * New Schema: PK: LiveSites, SK: <email>, ATTR1: <subdomain>, ATTR2: <siteSettings>
 * Since subdomain is now in ATTR1, we need to query with filter
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

        const { queryItem } = require("../utility/db");

        const params = {
            pk: "LiveSites",
            filter: "ATTR1 = :subdomain",
            filterValues: {
                ":subdomain": subdomain
            }
        };

        console.log('[DEBUG] Getting site settings by subdomain (new schema):', JSON.stringify(params, null, 2));
        
        const response = await queryItem(params);
        
        if (!response.Items || response.Items.length === 0) {
            console.log('[DEBUG] No site found for subdomain:', subdomain);
            return null;
        }

        // Should only be one item since subdomain should be unique
        const item = response.Items[0];
        
        console.log('[DEBUG] Site settings retrieved successfully for subdomain:', subdomain);
        console.log('[DEBUG] Email owner:', item.SK);
        return item.ATTR2; // ATTR2 now contains the site settings

    } catch (e) {
        console.error('Error in getSiteSettingsBySubdomainModel:', e);
        throw new Error(e.message || 'Failed to get site settings by subdomain');
    }
}

/**
 * Check if subdomain exists in LiveSites table
 * New Schema: PK: LiveSites, SK: <email>, ATTR1: <subdomain>
 * 
 * @param {Object} params - Function parameters
 * @param {string} params.subdomain - Subdomain to check
 * @returns {Promise<boolean>} - True if subdomain exists, false otherwise
 * @throws {Error} If check fails
 */
async function checkSubdomainModel({ subdomain }) {
    try {
        if (!subdomain) {
            throw new Error("subdomain is required");
        }

        const { queryItem } = require("../utility/db");

        const params = {
            pk: "LiveSites",
            filter: "ATTR1 = :subdomain",
            filterValues: {
                ":subdomain": subdomain
            }
        };

        console.log('[DEBUG] Checking subdomain existence (new schema):', JSON.stringify(params, null, 2));
        
        const response = await queryItem(params);
        
        // If any Items exist with this subdomain, it's taken
        const exists = response.Items && response.Items.length > 0;
        
        console.log('[DEBUG] Subdomain check result - exists:', exists);
        if (exists) {
            console.log('[DEBUG] Subdomain owned by email:', response.Items[0].SK);
        }
        return exists;

    } catch (e) {
        console.error('Error in checkSubdomainModel:', e);
        throw new Error(e.message || 'Failed to check subdomain');
    }
}

module.exports = {
    saveDraftSiteSettingsModel,
    getDraftSiteSettingsModel,
    publishSiteSettingsModel,
    getLiveSiteSettingsModel,
    getSiteSettingsBySubdomainModel,
    checkSubdomainModel
};
