/**
 * Google Apps Script for Phoenix Business
 * Automatically forwards specific emails to SMS.
 * 
 * Setup Instructions:
 * 1. Go to https://script.google.com/ while logged into partnership@carter-portfolio.fyi
 * 2. Create a new project and paste this code in.
 * 3. Replace YOUR_PHONE_NUMBER@YOUR_CARRIER_GATEWAY.com with your actual SMS gateway address.
 *    - Verizon: 1234567890@vtext.com
 *    - AT&T: 1234567890@txt.att.net
 *    - T-Mobile: 1234567890@tmomail.net
 * 4. Click the "Triggers" clock icon on the left menu.
 * 5. Add a new trigger: 
 *    - Choose which function to run: checkRefundRequests
 *    - Select event source: Time-driven
 *    - Select type of time based trigger: Minutes timer
 *    - Select minute interval: Every 5 minutes
 * 6. Save the trigger. Google will ask for permission to read your emails and send emails.
 */

const SMS_GATEWAY_EMAIL = 'YOUR_PHONE_NUMBER@YOUR_CARRIER_GATEWAY.com';

function checkRefundRequests() {
  // Search for unread emails with the exact subject "Refund Request"
  const threads = GmailApp.search('is:unread subject:"Refund Request"');
  
  for (let i = 0; i < threads.length; i++) {
    const thread = threads[i];
    const messages = thread.getMessages();
    
    // We only care about the latest message in the thread
    const latestMessage = messages[messages.length - 1];
    
    if (latestMessage.isUnread()) {
      const sender = latestMessage.getFrom();
      const bodySnippet = latestMessage.getPlainBody().substring(0, 100); // Get first 100 chars
      
      // Send SMS
      const smsBody = `URGENT: Refund Request from ${sender}.\n\nPreview: ${bodySnippet}...`;
      
      try {
        MailApp.sendEmail({
          to: SMS_GATEWAY_EMAIL,
          subject: 'Phoenix Alert', // Keep subject short for SMS
          body: smsBody
        });
        
        // Mark as read so we don't trigger SMS again for this specific email
        latestMessage.markRead();
        
      } catch (e) {
        console.error('Failed to send SMS for Refund Request:', e);
      }
    }
  }
}
