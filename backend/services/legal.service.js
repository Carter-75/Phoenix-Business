const PDFDocument = require('pdfkit');

/**
 * Service to manage legal policy text and generate merged PDFs for contracts
 */
const getDynamicPolicies = () => {
    const discountPercentage = parseInt(process.env.DISCOUNT_PERCENTAGE || '0');
    const applyDiscount = (amount) => Math.round(amount * (1 - (discountPercentage / 100)));
    
    const simpleCost = applyDiscount(parseInt(process.env.PRICE_SIMPLE || '83200')) / 100;
    const tier2Setup = applyDiscount(parseInt(process.env.PRICE_ESSENTIAL_SETUP || '55400')) / 100;
    const tier2Monthly = applyDiscount(parseInt(process.env.PRICE_ESSENTIAL_MONTHLY || '27600')) / 100;
    const tier3Setup = applyDiscount(parseInt(process.env.PRICE_PROFESSIONAL_SETUP || '99800')) / 100;
    const tier3Monthly = applyDiscount(parseInt(process.env.PRICE_PROFESSIONAL_MONTHLY || '49800')) / 100;
    
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    return {
        TERMS_OF_SERVICE: `
TERMS OF SERVICE
Last Updated: ${currentDate}

1. The Agreement
By engaging with Phoenix ("we", "us", "our"), you agree to enter into a binding service agreement. These terms apply to all clients, visitors, and users of our digital infrastructure services.

2. Contractual Commitment
Unless otherwise specified in a custom engagement agreement, all service tiers require a mandatory minimum commitment of twelve (12) consecutive months. This commitment ensures the stability and resource allocation necessary for elite digital architecture.
- One-Time Projects (Tier 1): Engagement terminates upon delivery of final assets and full payment of $${simpleCost}. No long-term commitment required.
- Subscription Services (Tiers 2 & 3): All subscription-based tiers require a mandatory minimum commitment of twelve (12) consecutive months. Tier 2 requires a $${tier2Setup} setup fee and $${tier2Monthly} monthly payments. Tier 3 requires an $${tier3Setup} setup fee and $${tier3Monthly} monthly payments.

3. Automatic Renewal
To prevent service interruption, your contract will automatically renew for subsequent 12-month periods. Notice of non-renewal must be provided via the client portal at least 30 days prior to the current contract's expiration date. Phoenix will provide a courtesy reminder notice via email exactly 30 days before your annual contract is set to renew. Once the automatic renewal occurs, you are bound to a new 12-month service agreement under these same terms.

4. Early Termination & Liquidated Damages
Early termination of the 12-month commitment by the client results in the immediate accrual of "Liquidated Damages." This fee is calculated as 50% of the remaining total contract value.

5. Payment & Non-Refundability
Payments are processed via Stripe and are due monthly or yearly as per the selected plan. All payments are strictly non-refundable once the service period has commenced.

6. Limitation of Liability
Phoenix liability is limited to the total amount paid by the client in the 3 months preceding any claim.

7. Communications & Deliverability
It is the client's responsibility to maintain a valid, active email address on file and to whitelist communications from our domain. Any legal or administrative notice successfully dispatched from our servers is considered formally and legally delivered.

8. Governing Law
This agreement is governed by the laws of the State of Wisconsin.
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
All initial setup and startup fees are non-refundable.

4. Trial Periods
Promotional "Limited Trial" periods allow cancellation to prevent future charges, but setup fees remain non-refundable.

5. Cancellation vs. Refund
Cancellation stops future charges but does not entitle the client to a refund of past payments.
        `
    };
};

/**
 * Generates a merged PDF buffer of all legal policies
 * @returns {Promise<Buffer>}
 */
const generateMergedLegalPDF = () => {
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

        const policies = getDynamicPolicies();

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
