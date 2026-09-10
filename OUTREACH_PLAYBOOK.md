# Outreach operations
Status: research and message drafts. No messages sent.

## Sourcing and eligibility
Use public business websites and legitimate directories manually. Record source URL, inspection date, business name, website, public business contact, verified problem, proposed fix, status, and next action. No guessed emails. Do not scrape personal profiles or buy a bulk list. Exclude companies with no specific issue, prior opt-outs, franchises without local authority, or unclear ownership.
Use private CRM records for contact data. Do not commit contact lists. The research notes in outputs contain public website candidates only; they are not a sending list.
Stages: researched, eligible, approved_to_contact, contacted, replied, qualified, call_booked, proposal, won, lost, suppressed. Every open item needs one owner and one dated next action. The new inbound CRM covers new through lost. The existing outreach system owns outbound suppression. They are not yet unified.

## Compliance gate
[FTC CAN-SPAM guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business): commercial B2B email needs accurate identity and subject, ad identification, valid postal address, and clear opt-out. Honor opt-outs promptly; the legal maximum described by FTC is ten business days. Operate with immediate suppression. Keep the opt-out available for at least 30 days. Do not sell or transfer opted-out records except for compliance handling.
[Google sender guidance](https://support.google.com/mail/answer/81126?hl=en): authenticate email, use TLS, and keep spam rates below 0.3%; Google recommends staying below 0.1%. Configure SPF, DKIM, and DMARC alignment even at low volume. Bulk requirements differ. These instructions do not replace jurisdiction-specific legal review.
Before first send: confirm sender mailbox, business postal address, provider terms, SPF/DKIM/DMARC, controlled inbox receipt, and suppression tests. No artificial engagement or fake warm-up. No automatic sending increase.

## Drafts — replace brackets only with verified facts
All messages end: “Carter | Phoenix Websites | [valid business postal address]. This is a business advertisement. Reply ‘stop’ to receive no further marketing emails.” The address is not yet confirmed; these are not send-ready.
A — Subject: A small fix on [business]’s website
Hi [name/team], I noticed [exact observed problem] on [page]. A simple fix would be [specific change]. I build websites for service businesses. Would a short review with three practical fixes be useful?
B — Subject: Your estimate request page
Hi [name/team], I checked [page] and found [verified friction]. I can send a short screen review showing how I would improve that step. There is no charge for the review. Would you like it?
C — Subject: Website copy note for [business]
Hi [name/team], your [section] currently says “[short exact wording]”. I suggest [plain correction]. If useful, I can review the rest of the page and send three fixes. I build and repair small-business websites.
D — Subject: Follow-up on the website note
Hi [name/team], one follow-up on [specific issue]. I can send the short review if it would help. If this is not a priority, I will close the loop here.
Use only two initial variants in the first experiment. D is the single follow-up after five business days. Stop after a reply, opt-out, or bounce. Do not use deceptive Re: or Fwd: subjects.

## Suppression control
Normalize recipient addresses by trimming and lowercasing. Check suppression immediately before every scheduled and manual send. An opt-out must cancel pending follow-ups and persist even when a lead is deleted or reimported. The existing system has a unique userId+recipientEmail suppression index and a manual-reply check. Full automated sequence behavior remains unverified. Do not launch until a controlled test proves all send paths suppress.
Test recipient opts out; repeat opt-out; attempt manual reply; attempt next scheduled step; reimport same address. All must block. A provider acceptance is not proof of inbox delivery.

## Audit fulfillment and call
Spend 20 minutes maximum. Record the page, device width, three observations, screenshots you may lawfully use, proposed fixes, and any limitation. Do not claim lost revenue without data. Send only after approval. Ask the buyer which service matters, where they work, their budget, who decides, and target date. Offer two call times manually. A click is not a booked call.

## Partnerships
Research local chambers and complementary photographers, branding designers, and SEO specialists. Start with [Greater Madison Chamber](https://madisonbiz.com/) as a candidate directory, pending current program review. Draft: “I build small-business websites and am looking for a photographer or brand designer whose clients need a reliable website handoff. Would a short introduction be useful?”
Proposed referral terms: no exclusivity; client consent before sharing details; disclose any referral fee; pay only on collected project revenue after the refund window. Start with reciprocal introductions and no fee. Any financial terms need separate approval and written agreement.

## Continued implementation
Google identity verification is resolved. The Search draft now shows All changes saved and Your campaign is ready to publish. Three exact/phrase keywords and the full responsive ad were saved. The draft budget is $4.90/day; the bidding screen shows a $3 maximum CPC limit. It remains unpublished. The live Performance Max campaign remains $6.57/day. Google draft validation does not verify the landing page, lead tracking, or negative keywords; those remain launch gates.

Added a shared suppression check to the common outreach delivery service and all three direct inbox delivery sites, including the delayed send callback. Ten isolated tests passed: legacy mixed-case/whitespace addresses, recipient lists, business-name suppression, literal-name matching, account isolation, allowed delivery, database failure, missing owner, invalid recipient, and opt-out before queued delivery. Four additional files were applied locally, including the tests. No deployment or message was sent. See OUTREACH_SAFETY.patch. Live end-to-end opt-out behavior remains unverified.

The business mailing address has been requested for final outreach preparation. Existing credential rotation, owner CRM configuration, and live staging checks remain required. No revenue or sale has been verified.

## Live persona findings
The existing outreach address matches the address confirmed by the owner. No address change was needed. The live persona combines websites and data sales, uses strong unverified revenue language, and instructs the sender to say it has closely followed the prospect. It also says communication is by email, with no personal phone calls. Future outreach should use one website offer, an observation actually verified, and an email reply as its first action. Do not promise a call with Carter without confirming that preference. No live persona change or new send was made.

## Confirmed data offer and automation — September 10
The owner clarified that Phoenix cleans and organizes client-provided files using Microsoft tools and AI. It does not currently sell data lists or public-record blocks. This supersedes earlier offer assumptions. A quote-based data-cleanup page, services card, and request flow are implemented locally. New legacy data purchases are blocked locally; the old data entry page redirects to cleanup. Production rollout remains pending. A daily 9 a.m. Central operations heartbeat is active; it performs monitoring and authorized preparation, not unapproved sending, purchasing, or deployment. See the session outputs/CURRENT_STATUS.md for the current blockers and verification limits.
