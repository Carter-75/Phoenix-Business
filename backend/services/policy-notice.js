/**
 * Shared subject-word notice for automated email.
 *
 * Under the client communication policy, every automated email the app sends
 * tells the recipient which word to include in the subject line when
 * replying, so replies are routed and read. Order, project, renewal, and
 * review mail use ORDER. Outreach mail uses OUTREACH (see subjectWordNoticeText).
 *
 * The purchase confirmation email carries the full version of the
 * instructions (COMMUNICATION_GUIDE_TEXT / communicationGuideHtml below),
 * because it is the first email a new client receives and the one they are
 * most likely to reply to. Every other automated email carries the short
 * one-line notice.
 */

const SUBJECT_WORD_NOTICE =
  'Replying to us? Please include the word ORDER in your subject line. Under our communication policy, email without the subject word may not be routed or read.';

const COMMUNICATION_GUIDE_TEXT = [
  'HOW TO REACH US ABOUT YOUR PROJECT',
  'Please reply to this email and keep this thread going for anything about your order or your project. When you reply, add one of these words as a standalone word in the subject line (your email app keeps the old subject, so just add the word to it):',
  '',
  '- ORDER: anything about this order or your project (questions, requests, changes, files). This is the word you will use most.',
  '- NEW: a brand-new inquiry that is separate from this project.',
  '- OUTREACH: when you are replying to outreach from us.',
  '',
  'Example subject: "ORDER - Question about my homepage"',
  '',
  'Why we ask: every message we receive is sorted by that subject word, so it lands with the right project, gets read, and gets answered. Email without a subject word can slip past our system and may not be read.',
  '',
  'This is part of the communication policy in the agreement you accepted at checkout. If a message about your project arrives without the word, we will send you a warning email and you will have 5 days to reply with ORDER in the subject line to keep everything moving. If we do not hear back in that window, your project will be archived (your project data is kept, not deleted), your subscription will be cancelled, and a refund will be issued minus the startup fee described in your agreement.'
].join('\n');

function communicationGuideHtml(style) {
  const s = style || 'font-size: 13px; color: #475569; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 14px 16px; line-height: 1.6;';
  return `
      <div style="${s}">
        <strong style="color: #0f172a; display: block; margin-bottom: 6px; font-size: 14px;">How to reach us about your project</strong>
        <p style="margin: 0 0 8px 0;">Please reply to this email and keep this thread going for anything about your order or your project. When you reply, add one of these words as a standalone word in the subject line (your email app keeps the old subject, so just add the word to it):</p>
        <ul style="margin: 0 0 8px 0; padding-left: 20px;">
          <li><strong>ORDER</strong>: anything about this order or your project (questions, requests, changes, files). This is the word you will use most.</li>
          <li><strong>NEW</strong>: a brand-new inquiry that is separate from this project.</li>
          <li><strong>OUTREACH</strong>: when you are replying to outreach from us.</li>
        </ul>
        <p style="margin: 0 0 8px 0;">Example subject: <strong>ORDER - Question about my homepage</strong></p>
        <p style="margin: 0 0 8px 0;"><strong>Why we ask:</strong> every message we receive is sorted by that subject word, so it lands with the right project, gets read, and gets answered. Email without a subject word can slip past our system and may not be read.</p>
        <p style="margin: 0;">This is part of the communication policy in the agreement you accepted at checkout. If a message about your project arrives without the word, we will send you a warning email and you will have 5 days to reply with ORDER in the subject line to keep everything moving. If we do not hear back in that window, your project will be archived (your project data is kept, not deleted), your subscription will be cancelled, and a refund will be issued minus the startup fee described in your agreement.</p>
      </div>`;
}

function subjectWordNoticeText(word) {
  const w = (word || 'ORDER').toUpperCase();
  return `Replying to us? Please include the word ${w} in your subject line. Under our communication policy, email without the subject word may not be routed or read.`;
}

function subjectWordNoticeHtml(word, style) {
  const s = style || 'font-size: 13px; color: #6b7280; margin-top: 16px; line-height: 1.5;';
  return `<p style="${s}">${subjectWordNoticeText(word)}</p>`;
}

module.exports = {
  SUBJECT_WORD_NOTICE,
  subjectWordNoticeText,
  subjectWordNoticeHtml,
  COMMUNICATION_GUIDE_TEXT,
  communicationGuideHtml
};
