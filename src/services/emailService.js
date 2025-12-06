import emailjs from '@emailjs/browser';

// Initialize EmailJS with your public key
// Get these from https://dashboard.emailjs.com/
const EMAILJS_SERVICE_ID = 'service_d8aqnzd'; // Replace with your service ID
const EMAILJS_TEMPLATE_ID = 'template_letkrl8'; // Replace with your template ID
const EMAILJS_PUBLIC_KEY = 'WNj_V7BeEtpOAGdYt'; // Replace with your public key

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

/**
 * Send decline notification email to resident
 * @param {string} email - Resident's email address
 * @param {string} fullName - Resident's full name
 * @param {string} declineReason - Reason for declining the registration
 * @returns {Promise} EmailJS response
 */
export const sendDeclineNotificationEmail = async (email, fullName, declineReason) => {
  try {
    const templateParams = {
      to_email: email,  // This is the recipient's email
      user_email: email,  // Some templates use this variable
      to_name: fullName,
      decline_reason: declineReason || 'Your registration does not meet our requirements. Please review your information and resubmit.',
      support_email: 'Admin1@barangay.gov' // Replace with your support email
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY  // Add public key as 4th parameter
    );

    console.log('Decline notification email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Failed to send decline notification email:', error);
    throw error;
  }
};

/**
 * Send approval notification email to resident
 * @param {string} email - Resident's email address
 * @param {string} fullName - Resident's full name
 * @returns {Promise} EmailJS response
 */
export const sendApprovalNotificationEmail = async (email, fullName) => {
  try {
    const templateParams = {
      to_email: email,  // This is the recipient's email
      user_email: email,  // Some templates use this variable
      to_name: fullName,
      support_email: 'Admin1@barangay.gov' // Replace with your support email
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      'template_letkrl8', // Use the same template ID for now (you can create a separate approval template later)
      templateParams,
      EMAILJS_PUBLIC_KEY  // Add public key as 4th parameter
    );

    console.log('Approval notification email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Failed to send approval notification email:', error);
    throw error;
  }
};
