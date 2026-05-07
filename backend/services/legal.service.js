const PDFDocument = require('pdfkit');

/**
 * Service to manage legal policy text and generate merged PDFs for contracts
 */
const LEGAL_POLICIES = {
    TERMS_OF_SERVICE: `
TERMS OF SERVICE
Last Updated: May 7, 2026

1. The Agreement
By engaging with Phoenix ("we", "us", "our"), you agree to enter into a binding service agreement. These terms apply to all clients, visitors, and users of our digital infrastructure services.

2. Contractual Commitment
Unless otherwise specified in a custom engagement agreement, all service tiers require a mandatory minimum commitment of twelve (12) consecutive months. This commitment ensures the stability and resource allocation necessary for elite digital architecture.
- Subscription Services: All subscription-based tiers require a mandatory minimum commitment of twelve (12) consecutive months.

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
Last Updated: May 7, 2026

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
Last Updated: May 7, 2026

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

        // Policies
        Object.keys(LEGAL_POLICIES).forEach((key, index) => {
            const content = LEGAL_POLICIES[key];
            const title = key.replace(/_/g, ' ');
            
            doc.fontSize(16).text(title, { underline: true });
            doc.moveDown();
            doc.fontSize(10).text(content.trim(), {
                lineGap: 5,
                paragraphGap: 10,
                align: 'justify'
            });
            
            if (index < Object.keys(LEGAL_POLICIES).length - 1) {
                doc.addPage();
            }
        });

        doc.end();
    });
};

module.exports = {
    generateMergedLegalPDF,
    LEGAL_POLICIES
};
