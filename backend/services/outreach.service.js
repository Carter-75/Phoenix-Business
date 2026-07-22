const nodemailer = require('nodemailer');
const { OpenAI } = require('openai');
const mongoose = require('mongoose');
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

    // Cache the persona so we don't query DB on every email
    this._personaCache = null;
    this._personaCacheExpiry = 0;
  }

  /**
   * Fetches the admin persona from the Cold Email User document in the shared MongoDB.
   * Looks up by ADMIN_EMAIL env var (defaults to cartermoyer75@gmail.com).
   * Caches for 10 minutes to avoid repeated DB queries.
   */
  async getPersona() {
    const now = Date.now();
    if (this._personaCache && now < this._personaCacheExpiry) {
      return this._personaCache;
    }

    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'cartermoyer75@gmail.com';
      const db = mongoose.connection.db;
      if (!db) {
        console.warn('[OutreachService] No DB connection for persona lookup, using fallback.');
        return this._fallbackPersona();
      }

      const adminUser = await db.collection('users').findOne(
        { email: adminEmail },
        { projection: { 'config.personaContext': 1, 'config.companyName': 1, 'config.companyDesc': 1, 'config.serviceDesc': 1, 'config.valueProp': 1, 'config.targetOutcome': 1, 'config.websiteUrl': 1, 'config.senderName': 1, 'config.senderTitle': 1, 'config.signature': 1, 'config.dataEnrichment.aiInstructions': 1, 'displayName': 1 } }
      );

      if (!adminUser || !adminUser.config) {
        console.warn('[OutreachService] Admin user not found or no config, using fallback persona.');
        return this._fallbackPersona();
      }

      const c = adminUser.config;
      this._personaCache = {
        personaContext: c.personaContext || '',
        companyName: c.companyName || 'Phoenix',
        companyDesc: c.companyDesc || '',
        serviceDesc: c.serviceDesc || '',
        valueProp: c.valueProp || '',
        targetOutcome: c.targetOutcome || '',
        websiteUrl: c.websiteUrl || 'https://phoenixwebsites.ai',
        senderName: c.senderName || adminUser.displayName || 'Carter Moyer',
        senderTitle: c.senderTitle || 'Full Stack Developer',
        signature: c.signature || '',
        dataAiInstructions: c.dataEnrichment?.aiInstructions || ''
      };
      this._personaCacheExpiry = now + 10 * 60 * 1000; // 10 min cache

      console.log(`[OutreachService] Persona loaded from DB for ${adminEmail}`);
      return this._personaCache;
    } catch (err) {
      console.error('[OutreachService] Persona fetch error:', err.message);
      return this._fallbackPersona();
    }
  }

  /**
   * Fallback persona if DB lookup fails — minimal defaults.
   */
  _fallbackPersona() {
    return {
      personaContext: '',
      companyName: 'Phoenix',
      companyDesc: 'Full-stack web development and digital infrastructure',
      serviceDesc: 'High-performance web applications',
      valueProp: 'Getting your website flying off the charts as fast as possible',
      targetOutcome: 'Digital growth and web presence',
      websiteUrl: 'https://phoenixwebsites.ai',
      senderName: 'Carter Moyer',
      senderTitle: 'Full Stack Developer',
      signature: '',
      dataAiInstructions: ''
    };
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

      const persona = await this.getPersona();

      const mailOptions = {
        from: `"${persona.senderName}" <${process.env.EMAIL_USER}>`,
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
      const persona = await this.getPersona();
      const mailOptions = {
        from: `"${persona.senderName} (Test)" <${process.env.EMAIL_USER}>`,
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
    const persona = await this.getPersona();

    // Build dynamic system prompt from DB persona
    const personaBlock = persona.personaContext
      ? `Persona Context (from your profile):\n${persona.personaContext}`
      : `Persona Context:
    - You are ${persona.senderName}, ${persona.senderTitle} at ${persona.companyName}.
    - ${persona.companyDesc || 'You build high-performance web applications.'}
    - Value Proposition: ${persona.valueProp || 'Getting websites flying off the charts.'}
    - ${persona.serviceDesc || 'Full-stack web development and digital infrastructure.'}
    - Target Outcome: ${persona.targetOutcome || 'Digital growth and improved web presence.'}`;

    const systemPrompt = `You are ${persona.senderName}, ${persona.senderTitle} at ${persona.companyName}. 
    
    ${personaBlock}
    
    POLICY: You do NOT provide calls. All communication is asynchronous for maximum speed (the "Flying Connection").
    
    AI Formatting Rules:
    - **CRITICAL**: Use ONLY plain text. Do NOT use markdown (no asterisks, no hashes, no bolding).
    - **CRITICAL**: Do NOT include a subject line. Start directly with the email body.
    - **CRITICAL**: Do NOT include any sign-off or signature (it is added by the system).
    - **CRITICAL**: Max 4-6 sentences.
    
    Linguistic Rules:
    - Mention their company specifically: ${lead.businessName || 'your business'}.
    - Emphasize speed and the "${persona.companyName}" branding.
    - Direct them to your site (${persona.websiteUrl}) to check out reviews from other companies and see live examples.`;

    const userPrompt = `Generate an outreach email for ${lead.businessName || 'this business'}.`;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
    });

    let body = completion.choices[0].message.content.trim().replace(/\n/g, '<br>');
    
    const signature = persona.signature ? `<br><br>${persona.signature}` : (process.env.EMAIL_SIGNATURE ? `<br><br>${process.env.EMAIL_SIGNATURE}` : '');

    const footer = `
      <br><br>
      <hr style="border: 0; border-top: 1px solid #eee;">
      <p style="font-size: 11px; color: #999;">
        <strong>Legal Disclosure:</strong> This communication is from ${persona.senderName} at ${persona.companyName}. 
        You are receiving this because ${lead.businessName || 'your business'} was identified as a candidate for digital optimization based on public data.<br>
        <a href="${process.env.PROD_BACKEND_URL || 'http://localhost:3000'}/api/leads/unsubscribe?email=${encodeURIComponent(lead.email)}" style="color: #4f46e5; text-decoration: underline;">Opt-out of future communications</a>
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

  /**
   * Generate an AI summary paragraph for data delivery emails.
   * Uses the persona context + data records to write a personalized message.
   */
  async generateDataDeliverySummary(records, buyerFirstName) {
    const persona = await this.getPersona();

    const recordSummary = records.slice(0, 20).map(r => {
      const s = r.structured || {};
      return `${s.companyName || 'Unknown'} (${s.projectType || 'N/A'}) in ${s.location?.city || '?'}, ${s.location?.state || '?'} — $${s.estimatedBudget || 0}`;
    }).join('\n');

    const systemPrompt = `You are ${persona.senderName} from ${persona.companyName}. You are writing a brief paragraph (3-5 sentences) to include in a data delivery email. The buyer just purchased a block of AI-enriched public records (building permits, government contracts, business filings).

${persona.personaContext ? `Your persona context:\n${persona.personaContext}` : ''}

Rules:
- Be warm, professional, and confident.
- Briefly highlight what makes this data valuable (contact info, budget data, AI summaries).
- Mention they can always come back to buy more blocks at ${persona.websiteUrl || 'phoenixwebsites.ai'}/data.
- Do NOT use markdown, asterisks, or bold text. Plain text only.
- Keep it 3-5 sentences max.
- Address the buyer by their first name: ${buyerFirstName || 'there'}.`;

    const userPrompt = `The buyer "${buyerFirstName || 'Customer'}" just purchased ${records.length} records. Here's a sample of what they got:\n\n${recordSummary}\n\nWrite the delivery paragraph.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 300
      });

      return completion.choices[0].message.content.trim();
    } catch (err) {
      console.error('[OutreachService] AI summary generation failed:', err.message);
      throw err;
    }
  }
}

module.exports = new OutreachService();
