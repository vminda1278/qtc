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

/**
 * Submit a lead/inquiry from a public site
 * 
 * @route POST /v1/public/lead
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function submitLead(req, res) {
    try {
        const { name, email, mobile, service, message, subdomain } = req.body;
        
        // Validate required fields
        if (!name || !email || !mobile || !subdomain) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, mobile, and subdomain are required'
            });
        }

        console.log('[DEBUG] submitLead called for subdomain:', subdomain);

        // Get site owner's email from site settings
        const siteSettings = await adminModel.getSiteSettingsBySubdomainModel({ subdomain });

        if (!siteSettings || !siteSettings.GeneralSettings?.email) {
            return res.status(404).json({
                success: false,
                message: 'Site not found or owner email not configured'
            });
        }

        const ownerEmail = siteSettings.GeneralSettings.email;
        const firmName = siteSettings.GeneralSettings?.name || subdomain;

        console.log('[DEBUG] Sending lead notification to:', ownerEmail);

        // Save lead to database with owner's email
        const leadData = {
            name,
            email,
            mobile,
            service: service || 'General Inquiry',
            message: message || '',
            subdomain,
            ownerEmail, // Owner's email - used as PK for leads
            submittedAt: new Date().toISOString()
        };

        await adminModel.saveLeadModel(leadData);

        // Send email notification to site owner
        const { sendEmail } = require('../utility/ses');
        
        const emailSubject = `New Lead from ${firmName} Website`;
        const emailBody = `
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #4F46E5;">New Lead Inquiry</h2>
                    <p>You have received a new inquiry from your website <strong>${subdomain}.qwiktax.in</strong></p>
                    
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #4F46E5;">Contact Details:</h3>
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                        <p><strong>Mobile:</strong> <a href="tel:${mobile}">${mobile}</a></p>
                        <p><strong>Service Interested In:</strong> ${service || 'General Inquiry'}</p>
                        ${message ? `<p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>` : ''}
                    </div>
                    
                    <p style="color: #666; font-size: 14px;">
                        <strong>Next Steps:</strong> Please contact the customer at their provided email or mobile number to discuss their requirements.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    <p style="color: #999; font-size: 12px;">
                        This is an automated notification from QwikTax. You are receiving this because someone submitted an inquiry on your website.
                    </p>
                </body>
            </html>
        `;

        await sendEmail(ownerEmail, emailSubject, emailBody);

        console.log('[DEBUG] Lead saved and email sent successfully');

        return res.status(200).json({
            success: true,
            message: 'Your inquiry has been submitted successfully. We will contact you soon.'
        });

    } catch (error) {
        console.error('Error in submitLead:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to submit inquiry. Please try again.',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

module.exports = {
    getSiteBySubdomain,
    submitLead
};
