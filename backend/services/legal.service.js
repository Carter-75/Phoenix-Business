const PDFDocument = require('pdfkit');

/**
 * Service to manage legal policy text and generate merged PDFs for contracts
 */
const getDynamicPolicies = (contractData = {}) => {
    const { tier = 'unknown', setupFee = 0, monthlyFee = 0 } = contractData;
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    let commitmentText = '';
    if (tier === 'simple') {
        commitmentText = `- Simple Launch Subscription: You agree to a one-time setup fee of $${(setupFee / 100).toFixed(2)} and recurring monthly payments of $${(monthlyFee / 100).toFixed(2)}. The first monthly payment is due after the 30-day subscription trial. The setup fee is due at checkout. The twelve-month commitment, renewal, cancellation, and separate website buyout provisions below apply.`;
    } else {
        commitmentText = `- Subscription Service: This subscription requires a mandatory minimum commitment of twelve (12) consecutive months. You have agreed to a $${(setupFee / 100).toFixed(2)} setup fee and $${(monthlyFee / 100).toFixed(2)} monthly payments. The setup fee is due at checkout. Monthly billing starts after the 30-day subscription trial.\n- Price Lock Guarantee: Your monthly subscription price for this specific website project is permanently locked in for the lifetime of your continuous subscription. Even if our public rates increase in the future, your monthly fee for this project will never go up. Note that this guarantee applies strictly on a per-project basis; any additional websites or distinct projects you commission from Phoenix will be subject to the pricing and a separate contract applicable at that time.`;
    }

    return {
        TERMS_OF_SERVICE: `
TERMS OF SERVICE
Last Updated: ${currentDate}

1. The Agreement
By engaging with Phoenix Websites AI ("we", "us", "our"), you agree to enter into a legally binding service agreement. These terms apply to all clients, visitors, and users of our digital infrastructure and software engineering services.

2. Contractual Commitment & Two-Component Architecture
Unless otherwise agreed in a separate signed master statement of work, all website platform tiers require a mandatory minimum commitment of twelve (12) consecutive months. Every engagement consists of two distinct components: an initial one-time development and setup fee due at checkout, and ongoing monthly managed cloud care and hosting starting approximately thirty (30) days post-purchase via Stripe deferred subscription trial.
${commitmentText}

3. Automatic Renewal & Statutory Notice Window (Wis. Stat. § 134.49 Compliance)
To prevent disruption of mission-critical business websites, subscriptions automatically renew for successive twelve (12) month periods upon expiration of the initial term.
In compliance with Wisconsin business contract standards (Wis. Stat. § 134.49(3) & (4)), Phoenix Websites AI delivers written statutory reminder notifications via electronic mail to the client's registered email address between fifteen (15) and sixty (60) days prior to the non-renewal notice deadline. To decline renewal, the client must submit notice of non-renewal at least thirty (30) days prior to the annual expiration date via the authenticated client portal or by emailing hello@phoenixwebsites.ai. Upon timely non-renewal, all services remain 100% active through the final day of the current term, terminating automatically with zero ($0) early-termination liquidated damages or cancellation penalties.

4. Early Termination & Stipulated Liquidated Damages (Wassenaar v. Panos Standard)
In the event of an early termination of the 12-month commitment initiated by the client prior to the standard notice window, the client shall be responsible for early-termination liquidated damages equal to 50% of the remaining monthly retainer fees through the end of the current commitment term.
Pursuant to the Wisconsin Supreme Court reasonableness standard in Wassenaar v. Panos, 111 Wis. 2d 518, 331 N.W.2d 326 (1983), the parties expressly agree that Phoenix heavily discounts upfront custom engineering based on the client's 12-month commitment; early termination causes immediate compensatory harm through unrecovered upfront engineering labor amortization, reserved edge-infrastructure capacity, and onboarding overhead; and the 50% formula reasonably forecasts actual compensatory damages by deducting the estimated 50% in variable ongoing fulfillment and server bandwidth costs avoided by Phoenix upon cancellation. The parties agree this sum is a reasonable forecast of just compensation and not a penalty.

5. Website Source Code Buyout Option & IP Transfer
The client may at any time voluntarily elect a permanent Website Source Code Buyout. The Buyout Fee is exactly 50% of the original one-time setup fee. The parties agree that this fee is separate and independent consideration for the permanent purchase, copyright assignment, and transfer of the uncompiled source code, database schemas, and bespoke assets, and for the permanent deactivation of automated licensing checks—not liquidated damages or a cancellation penalty. Upon payment, full intellectual property rights and deployment independence are irreversibly transferred to the client.

6. Payment, Delinquency Charges & Consumer Disclosures
All payments are processed via Stripe. Overdue balances following a 10-day cure period accrue:
- Commercial / Business Accounts: Monthly late finance charge of 1.5% per month (18% per annum) or a $25 administrative delinquency fee, whichever is greater, not to exceed the maximum permitted by Wisconsin law (Wis. Stat. § 138.05).
- Consumer Accounts: For transactions entered into by an individual primarily for personal, family, or household purposes governed by the Wisconsin Consumer Act (Wis. Stat. § 422.203 & DFI guidelines), delinquency charges are strictly limited to the statutory maximum of the lesser of $10.00 or 1% of the unpaid installment per month (12% per annum).

7. Payment Disputes & Chargeback Cost Recovery
In the event of an improper, bad-faith, or fraudulent chargeback filed for services properly performed under this Agreement, the client shall remain fully liable for the outstanding balance plus the actual third-party payment network dispute processing fee assessed by Stripe ($15.00) and substantiated administrative recovery costs. Legitimate statutory dispute rights are unaffected.

8. Collection Costs & Reasonable Attorney Fees
For commercial accounts, in the event of a material payment default requiring referral to third-party collection agencies or legal enforcement, the client agrees to pay all reasonable collection agency commissions, court costs, and reasonable attorney fees incurred by Phoenix Websites AI in enforcing this Agreement.

9. Service Scope & Optional Support Add-On Lifecycle
The base monthly managed cloud care fee includes cloud edge hosting, SSL certificates, automated daily snapshots, uptime monitoring, and base tier maintenance. Optional support duration add-ons (6, 12, or 24 months) provide priority ticket triage, multi-browser compatibility patching, dependency vulnerability updates, and minor update request allocations (up to 1.5 engineering hours per request; expiring monthly with zero rollover). Optional support does not automatically renew and concludes strictly at the end of its contracted duration, at which time monthly support billing ceases in Stripe without affecting the underlying base website agreement.
For clients selecting 24-Month Architecture Assurance: if the base website agreement renews at Month 12, support continues seamlessly in hosted mode into Year 2. If the client submits a timely non-renewal of the base website at Month 12, Phoenix cloud hosting terminates with zero continuing hosting charges, and the remaining 12 months of support automatically transition into Self-Hosted / Transition Support for Months 13–24 at the client's contracted locked monthly rate. Self-hosted transition support covers source-code bug fixes, dependency updates, security patches, deployment troubleshooting on client infrastructure, and 6 minor requests per month. Normal contract completion includes delivery of compiled production runtime assets under a non-exclusive deployment license; transfer of the uncompiled source code repository and complete intellectual property assignment remains governed exclusively by the optional 50% setup Buyout Fee under Section 7. Early termination of support creates a liquidated damages obligation of 50% of the remaining monthly support commitment fees under Wassenaar v. Panos, calculated strictly separate from base website damages.

10. Limitation of Liability
IN NO EVENT SHALL PHOENIX WEBSITES AI BE LIABLE FOR ANY INDIRECT, CONSEQUENTIAL, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO THIS AGREEMENT. TOTAL AGGREGATE LIABILITY SHALL BE STRICTLY LIMITED TO THE TOTAL AMOUNT PAID BY CLIENT TO PHOENIX IN THE THREE (3) MONTHS PRECEDING THE CLAIM.

11. Governing Law & Venue
This agreement is governed by the laws of the State of Wisconsin. Exclusive jurisdiction lies in the state and federal courts located in Wisconsin.
        `,
        PRIVACY_POLICY: `
PRIVACY POLICY
Last Updated: ${currentDate}

1. Information We Collect
We collect information that you provide directly to us, such as name, contact information, business details, and payment information processed via Stripe.

2. Legal Basis for Processing
We process data under "Legitimate Interest" to offer relevant digital infrastructure services to professional entities.

3. How We Use Your Data
Data is used to provide services, process payments, and communicate project updates or technical roadmaps.

4. Data Security
We implement industry-standard security measures, including SSL and secure third-party processors like Stripe and MongoDB Atlas.

5. Your Rights
You have the right to access, correct, or delete your personal information at any time.
        `,
        REFUND_POLICY: `
REFUND POLICY
Last Updated: ${currentDate}

1. General Policy
We maintain a strict no-refund policy for all payments made due to the high-resource intensity of our initial setup and dedicated reservation of capacity.

2. Why we don't refund
Engineering resources are immediately allocated upon subscription, including edge-network slots and isolated LLM data pipelines.

3. Setup Fees
All initial setup and startup fees are non-refundable, subject to published exceptions for complete failure to deliver the agreed core service. Refund requests must be sent to hello@phoenixwebsites.ai with the subject line "Refund Request".

4. Trial Periods
The 30-day subscription trial delays the first monthly payment. It does not waive the 12-month commitment, setup fee, or cancellation terms in the service agreement.

5. Cancellation vs. Refund
Cancellation and non-renewal follow the 60-to-30-day notice window and statutory standards in the service agreement (Wis. Stat. § 134.49). A cancellation request does not automatically remove unpaid fees or entitle you to a refund of past payments.

6. Chargebacks & Disputes
If an improper chargeback is initiated, client remains liable for the balance, the actual third-party $15.00 dispute processing fee, and legal collection costs. Unpaid commercial balances accrue interest at 1.5%/month under Wis. Stat. § 138.05; consumer accounts are capped at $10 or 1%/month under Wis. Stat. § 422.203.
        `
    };

    // Data Services Addendum — only included for data-inclusive tiers
    const dataServiceTiers = ['data'];
    if (dataServiceTiers.includes(tier)) {
        policies.DATA_SERVICES_AGREEMENT = `
DATA SERVICES AGREEMENT
Last Updated: ${currentDate}

1. Service Description
Phoenix ("we", "us") provides access to AI-enriched data records sourced from publicly available government databases, including but not limited to: municipal building permit databases, SAM.gov federal contract awards, state secretary of state filings, and other public records accessible under the Freedom of Information Act (FOIA) and equivalent state transparency laws. 

2. Data Source Legality
All data ingested by the Phoenix Data Intelligence pipeline is sourced exclusively from public records that are freely available without copyright restriction. We do not scrape, harvest, or otherwise collect any data protected by copyright, paywall, terms of service restriction, or privacy regulation (GDPR, CCPA, etc.). Raw source data is uncopyrighted government work product.

3. AI Processing & Accuracy Disclaimer
Records are processed by artificial intelligence (specifically, OpenAI GPT-4o models) and may contain errors, hallucinations, or incomplete data. Phoenix does not guarantee the accuracy, completeness, timeliness, or correctness of any individual data record. Clients are solely responsible for independently verifying any information before taking business action based on enriched data.

4. Permitted Use
Data accessed through Phoenix Data Intelligence may be used for:
- Internal business purposes and market research
- Lead generation and outreach campaigns
- Strategic planning and competitive analysis

Data may NOT be used for:
- Bulk resale or redistribution of raw data records
- Harassment, discrimination, stalking, or any unlawful purpose
- Circumvention of any law, regulation, or third-party terms of service

5. Payment & Refund Policy
- Plan: Data Intelligence ($149 — AI-enriched public records with full contact info, budgets, and AI summaries. Buy again anytime for fresh data.)
- Payment Type: ONE-TIME PURCHASE via Stripe.
- ALL DATA INTELLIGENCE PURCHASES ARE FINAL AND NON-REFUNDABLE. By completing payment, you acknowledge that you are purchasing immediate access to digital data services and expressly waive any right to a refund, chargeback, or credit.
- Chargebacks: Filing a chargeback on a completed data purchase constitutes a breach of this agreement and may result in immediate termination of access and collection action.

6. Delivery & Access
- Upon successful payment, access to your purchased data tier is activated immediately.
- You will receive a confirmation email with your purchase receipt and a link to your data portal.
- Data access is perpetual for the records delivered during your active access period.

7. Privacy & Security
- We do not share your enriched data with other clients or third parties.
- Aggregated, anonymized usage statistics may be used for internal analytics.

8. Intellectual Property
- You retain ownership of any insights, reports, or derivative works you create from enriched data.
- Phoenix retains ownership of the pipeline, algorithms, AI processing logic, and platform infrastructure.
- The raw source data (government records) is public domain and not owned by either party.

9. Limitation of Liability
Phoenix's total aggregate liability under this Data Services Agreement is strictly limited to the total amount paid by the client for the specific data purchase giving rise to the claim.

10. Governing Law
This agreement is governed by the laws of the State of Wisconsin.
        `;
    }

    return policies;
};

/**
 * Generates a merged PDF buffer of all legal policies
 * @returns {Promise<Buffer>}
 */
const generateMergedLegalPDF = async (contractData = {}) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        let buffers = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            resolve(Buffer.concat(buffers));
        });

        // Title Page
        doc.fontSize(24).text('PHOENIX DIGITAL INFRASTRUCTURE', { align: 'center' });
        doc.moveDown();
        doc.fontSize(18).text('Master Service Agreement & Legal Policies', { align: 'center' });
        doc.moveDown(2);
        doc.fontSize(12).text(`Generated for contract on: ${new Date().toLocaleDateString()}`, { align: 'center' });
        
        doc.addPage();

        const policies = getDynamicPolicies(contractData);

        // Policies
        Object.keys(policies).forEach((key, index) => {
            const content = policies[key];
            const title = key.replace(/_/g, ' ');
            
            doc.fontSize(16).text(title, { underline: true });
            doc.moveDown();
            doc.fontSize(10).text(content.trim(), {
                lineGap: 5,
                paragraphGap: 10,
                align: 'justify'
            });
            
            if (index < Object.keys(policies).length - 1) {
                doc.addPage();
            }
        });

        doc.end();
    });
};

module.exports = {
    generateMergedLegalPDF,
    getDynamicPolicies
};
