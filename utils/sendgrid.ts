import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailData {
  to: string;
  subject: string;
  text: string;
  html: string;
}

// Send alive check email
export const sendAliveCheckEmail = async (to: string, confirmationLink: string) => {
  const msg: EmailData = {
    to,
    subject: 'Last Message - Alive Check',
    text: `Please confirm you're still with us by clicking this link: ${confirmationLink}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Last Message - Alive Check</h2>
        <p>This is your scheduled alive check from Last Message.</p>
        <p>Please confirm you're still with us by clicking the button below:</p>
        <p style="text-align: center;">
          <a href="${confirmationLink}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">I'm Still Here</a>
        </p>
        <p>If you can't click the button, copy and paste this link into your browser:</p>
        <p>${confirmationLink}</p>
        <p>If we don't hear from you after multiple attempts, your pre-configured messages will be sent to your designated recipients.</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error('Error sending alive check email:', error);
    return { success: false, error };
  }
};

// Send final message to recipient
export const sendFinalMessage = async (to: string, message: string, fromName: string) => {
  const msg: EmailData = {
    to,
    subject: `A Final Message from ${fromName}`,
    text: message,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>A Final Message from ${fromName}</h2>
        <div style="padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin: 20px 0;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        <p style="color: #666; font-size: 12px;">This message was sent via Last Message service.</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error('Error sending final message:', error);
    return { success: false, error };
  }
};

// Send device passcode to recipient
export const sendDevicePasscode = async (to: string, deviceType: string, passcode: string, fromName: string) => {
  const msg: EmailData = {
    to,
    subject: `Device Access Information from ${fromName}`,
    text: `${fromName} has shared access information for their ${deviceType}. Passcode: ${passcode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Device Access Information from ${fromName}</h2>
        <div style="padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin: 20px 0;">
          <p><strong>Device Type:</strong> ${deviceType}</p>
          <p><strong>Passcode:</strong> ${passcode}</p>
        </div>
        <p style="color: #666; font-size: 12px;">This information was sent via Last Message service.</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error('Error sending device passcode:', error);
    return { success: false, error };
  }
};