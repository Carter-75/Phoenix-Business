const nodemailer = require('nodemailer');
const { OpenAI } = require('openai');
const Lead = require('../models/Lead');
const SentEmail = require('../models/SentEmail');

class OutreachService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.privateemail.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async validateEmailContent(content) {
    if (!content || content.length < 50) return false;
    if (content.includes('Subject:')) return false; // AI shouldn't include subject
    if (content.includes('**')) return false; // No markdown allowed
    return true;
  }

  async getSentTodayCount() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return await SentEmail.countDocuments({
      sentAt: { $gte: startOfToday },
      type: 'outreach'
    });
  }

  async runDailyOutreach() {
    const dailyLimit = parseInt(process.env.DAILY_OUTREACH_LIMIT || '1');
    const sentToday = await this.getSentTodayCount();
    
    if (sentToday >= dailyLimit) {
      console.log(`[Outreach] Daily limit reached (${sentToday}/${dailyLimit}). Skipping.`);
      return { status: 'limit_reached' };
    }

    const lead = await Lead.findOne({ status: 'pending' }).sort({ createdAt: 1 });
    if (!lead) {
      console.log('[Outreach] No pending leads found.');
      return { status: 'no_leads' };
    }

    try {
      const content = await this.generateAIContent(lead);
      
      // Pre-send check
      const isValid = await this.validateEmailContent(content);
      if (!isValid) {
        console.error('[Outreach] AI Content failed validation. Retrying...');
        return { status: 'failed_validation' };
      }

      const mailOptions = {
        from: `"Carter Moyer" <${process.env.EMAIL_USER}>`,
        to: lead.email,
        subject: `Accelerating ${lead.businessName || 'Your Business'}'s Digital Growth`,
        html: content
      };

      const info = await this.transporter.sendMail(mailOptions);

      await SentEmail.create({
        recipientEmail: lead.email,
        subject: mailOptions.subject,
        type: 'outreach',
        source: 'portfolio'  // Tag for cold-email dashboard cross-app merge
      });

      // Record send in thread so the dashboard can display the full conversation
      lead.thread = lead.thread || [];
      lead.thread.push({
        from: process.env.EMAIL_USER,
        to: lead.email,
        subject: mailOptions.subject,
        body: mailOptions.html,
        timestamp: new Date()
      });
      lead.status = 'emailed';
      lead.lastEmailedAt = new Date();
      await lead.save();

      return { status: 'success', messageId: info.messageId };
    } catch (error) {
      console.error('[Outreach] Error:', error.message);
      throw error;
    }
  }

  async sendTestOutreach(targetEmail) {
    const mockLead = {
      email: targetEmail,
      name: 'Test Prospect',
      businessName: 'Test Business Corp'
    };

    try {
      const content = await this.generateAIContent(mockLead);
      const mailOptions = {
        from: `"Carter Moyer (Test)" <${process.env.EMAIL_USER}>`,
        to: targetEmail,
        subject: `[TEST MODE] Accelerating Test Business Corp's Digital Growth`,
        html: content
      };

      const info = await this.transporter.sendMail(mailOptions);
      return { status: 'success', messageId: info.messageId };
    } catch (error) {
      console.error('[Outreach Test] Error:', error.message);
      throw error;
    }
  }

  async generateAIContent(lead) {
    const systemPrompt = `You are Carter Moyer, a Full Stack Developer at Phoenix (your own company). 
    
    Persona Context:
    - You specialize in architecting high-performance web applications and helping businesses scale their digital infrastructure. 
    - You are a computer science college student close to graduating and making a name for yourself.
    - Your priority at Phoenix is getting websites "flying off the charts" as soon as possible.
    - POLICY: You do NOT provide calls. All communication is asynchronous for maximum speed (the "Flying Connection").
    
    AI Formatting Rules:
    - **CRITICAL**: Use ONLY plain text. Do NOT use markdown (no asterisks, no hashes, no bolding).
    - **CRITICAL**: Do NOT include a subject line. Start directly with the email body.
    - **CRITICAL**: Do NOT include any sign-off or signature (it is added by the system).
    - **CRITICAL**: Max 4-6 sentences.
    
    Linguistic Rules:
    - Mention their company specifically: ${lead.businessName || 'your business'}.
    - Emphasize speed and the "Phoenix" branding.
    - Direct them to your site (https://carter-portfolio.fyi) to check out reviews from other companies and see live examples.`;

    const userPrompt = `Generate an outreach email for ${lead.businessName || 'this business'}.`;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
    });

    let body = completion.choices[0].message.content.trim().replace(/\n/g, '<br>');
    
    const signature = `
      <br><br>
      <table style="max-width: 520px; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333333;" border="0" cellspacing="0" cellpadding="0">
      <tbody>
      <tr>
      <td style="padding: 0 0 12px 0; border-bottom: 3px solid #00d4ff;"><span style="font-size: 23px; font-weight: bold; color: #111111; letter-spacing: -0.6px;">Carter Moyer</span> <br /><span style="font-size: 14.5px; color: #555555; font-weight: 500;">Full Stack AI Developer</span></td>
      </tr>
      <tr>
      <td style="padding: 16px 0 0 0;"><a style="color: #00d4ff; text-decoration: none; font-weight: 500;" href="mailto:hello@carter-portfolio.fyi">hello@carter-portfolio.fyi</a> <br /><a style="color: #00d4ff; text-decoration: none; font-weight: 500;" href="https://carter-portfolio.fyi">carter-portfolio.fyi</a></td>
      </tr>
      <tr>
      <td style="padding-top: 16px; font-size: 13.5px; color: #777777;">Building intelligent web applications • AI-powered experiences from frontend to backend</td>
      </tr>
      </tbody>
      </table>
    `;

    const footer = `
      <br><br>
      <hr style="border: 0; border-top: 1px solid #eee;">
      <p style="font-size: 11px; color: #999;">
        <strong>Legal Disclosure:</strong> This communication is from Carter Moyer at Phoenix. 
        You are receiving this because ${lead.businessName || 'your business'} was identified as a candidate for digital optimization based on public data.<br>
        <a href="https://www.carter-portfolio.fyi/api/leads/unsubscribe?email=${encodeURIComponent(lead.email)}" style="color: #4f46e5; text-decoration: underline;">Opt-out of future communications</a>
      </p>
    `;

    return `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px;">
        ${body}
        ${signature}
        ${footer}
      </div>
    `;
  }
}

module.exports = new OutreachService();
