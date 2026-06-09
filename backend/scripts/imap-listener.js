require('dotenv').config({ path: '../../.env.local' });
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');

const IMAP_HOST = process.env.IMAP_HOST;
const IMAP_PORT = parseInt(process.env.IMAP_PORT || '993', 10);
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);

// Use the explicit partnership email if provided, otherwise fallback to the global email user
const EMAIL_USER = process.env.PARTNERSHIP_EMAIL || process.env.EMAIL_USER;
const EMAIL_PASS = process.env.PARTNERSHIP_PASS || process.env.EMAIL_PASS;

const ADMIN_PHONE_NUMBER = process.env.ADMIN_PHONE_NUMBER;
const ADMIN_SMS_GATEWAY = process.env.ADMIN_SMS_GATEWAY;

if (!IMAP_HOST || !EMAIL_USER || !EMAIL_PASS || !ADMIN_PHONE_NUMBER || !ADMIN_SMS_GATEWAY) {
  console.error('Missing required environment variables for IMAP listener.');
  process.exit(1);
}

const SMS_EMAIL_ADDRESS = `${ADMIN_PHONE_NUMBER}@${ADMIN_SMS_GATEWAY}`;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, 
  auth: {
    user: process.env.EMAIL_USER, // We always send FROM the main verified SMTP account
    pass: process.env.EMAIL_PASS
  }
});

const imap = new Imap({
  user: EMAIL_USER,
  password: EMAIL_PASS,
  host: IMAP_HOST,
  port: IMAP_PORT,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
});

function openInbox(cb) {
  imap.openBox('INBOX', false, cb); // false means read-only is disabled (so we can mark as read)
}

imap.once('ready', function() {
  console.log('IMAP listener connected to', EMAIL_USER);
  
  openInbox(function(err, box) {
    if (err) throw err;
    console.log('Listening for new "Refund Request" emails...');
    
    imap.on('mail', function(numNewMsgs) {
      // Search for UNSEEN emails with the exact subject
      imap.search(['UNSEEN', ['SUBJECT', 'Refund Request']], function(err, results) {
        if (err || !results || results.length === 0) return;

        const f = imap.fetch(results, { bodies: '' });
        
        f.on('message', function(msg, seqno) {
          console.log(`Processing message #${seqno}`);
          
          let rawMail = '';
          msg.on('body', function(stream, info) {
            stream.on('data', function(chunk) {
              rawMail += chunk.toString('utf8');
            });
          });

          msg.once('end', function() {
            simpleParser(rawMail, async (err, parsed) => {
              if (err) {
                console.error('Failed to parse email:', err);
                return;
              }

              const sender = parsed.from.text;
              const snippet = parsed.text ? parsed.text.substring(0, 100) : 'No content';
              
              console.log(`Sending SMS alert for Refund Request from: ${sender}`);

              try {
                await transporter.sendMail({
                  from: process.env.EMAIL_USER,
                  to: SMS_EMAIL_ADDRESS,
                  subject: 'Phoenix Alert',
                  text: `URGENT: Refund Request from ${sender}.\n\nPreview: ${snippet}...`
                });
                console.log('SMS sent successfully!');

                // Mark the email as seen so we don't process it again
                imap.addFlags(results, ['\\Seen'], function(err) {
                  if (err) console.error('Failed to mark email as read:', err);
                });

              } catch (smsErr) {
                console.error('Error sending SMS via SMTP:', smsErr);
              }
            });
          });
        });

        f.once('error', function(err) {
          console.error('Fetch error:', err);
        });
      });
    });
  });
});

imap.once('error', function(err) {
  console.error('IMAP Error:', err);
});

imap.once('end', function() {
  console.log('IMAP connection ended');
});

// Connect
imap.connect();
