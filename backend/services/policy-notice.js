/**
 * Shared subject-word notice for automated email.
 *
 * Under the client communication policy, every automated email the app sends
 * tells the recipient which word to include in the subject line when
 * replying, so replies are routed and read. Order, project, renewal, and
 * review mail use ORDER. Outreach mail uses OUTREACH (see subjectWordNoticeText).
 */

const SUBJECT_WORD_NOTICE =
  'Replying to us? Please include the word ORDER in your subject line. Under our communication policy, email without the subject word may not be routed or read.';

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
  subjectWordNoticeHtml
};
