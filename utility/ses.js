const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

// Initialize SES client with region
// Use SES_REGION if specified, otherwise use the Lambda's AWS_REGION, fallback to us-east-1
const sesClient = new SESClient({
  region: process.env.SES_REGION || process.env.AWS_REGION || "us-east-1"
});

const sendEmail = async (toAddress, subject, body, fromEmail = null) => {
  try {
    // Validate inputs
    if (!toAddress || !subject || !body) {
      throw new Error('Missing required email parameters: toAddress, subject, or body');
    }

    // Use provided fromEmail or fallback to environment variable
    const senderEmail = fromEmail || process.env.DEFAULT_FROM_EMAIL || "QwikTax <hello@qwiktax.in>";

    console.log('[SES] Attempting to send email to:', toAddress);
    console.log('[SES] From:', senderEmail);
    console.log('[SES] Subject:', subject);

    const sendEmailCommand = new SendEmailCommand({
      Destination: {
        ToAddresses: [toAddress],
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: body,
          },
          Text: {
            Charset: "UTF-8",
            Data: body.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: subject,
        },
      },
      Source: senderEmail,
    });

    const data = await sesClient.send(sendEmailCommand);
    console.log('[SES] ✅ Email sent successfully! MessageId:', data.MessageId);
    return { success: true, messageId: data.MessageId };
    
  } catch (e) {
    console.error('[SES] ❌ Error sending email:', e.message);
    console.error('[SES] Full error:', JSON.stringify(e, null, 2));
    
    // Re-throw the error so calling function knows email failed
    throw new Error(`Failed to send email: ${e.message}`);
  }
};

module.exports = {
  sendEmail
}