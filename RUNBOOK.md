# Operating runbook
No deployment, outreach, hiring, or campaign launch is authorized by this file.

## Daily work
Review /growth-crm with the owner account. It shows the latest 100 inbound requests. A pending notification means the saved request needs manual attention. Set stage, next action, and due date. Review requests once each business day. Reply manually only under approved message scope. Qualify before counting a call conversion.
The CRM uses a separate AuditRequest collection. It never starts cold outreach. Configure GROWTH_ADMIN_USER_ID using the owner's existing immutable MongoDB user ID. Do not use a public email address as the access check. Missing ID fails closed. This setting is intentionally not written into environment files by this session.

## Controlled verification before deployment
Run node --test backend/tests/capture.test.js. Build Angular in an isolated preview. Start with no live database, email, payment, or cron credentials. Use fixture data and a mail sink. Verify fields, labels, errors, saved state, owner access, and CRM updates. Confirm dataLayer event only after a saved request. Use Stripe test keys and test webhooks for payment testing; TEST_MODE prices alone do not prove Stripe is in test mode. Do not use the existing test-sms scripts without inspecting their destinations.
Production verification remains a separate gate: controlled owner test inbox, isolated test database if possible, actual notification headers, CRM record, manual follow-up draft, analytics diagnostics, and safe payment/contract test. Do not silently test against customer records.

## Rollback
The reviewed changes were applied to the primary and cold-email repositories. They remain local and undeployed. Original changed files are backed up in the session work/backups directory; outputs/REVIEW_CHANGES.patch records the review diff. Preserve existing user changes. No force push. No production deployment without approval. If deployed later, keep the prior Vercel deployment ID and use an approved rollback. AuditRequest is additive; do not delete saved requests when reverting UI code. Keep owner guards even if reverting copy. Cold-email repository instructions prohibit automatic git add/commit/push; leave its edits unstaged.

## Outstanding access
Google Ads sign-in resolved. Correct conversion setup and launch review remain required. Analytics/Search Console: needed for property IDs, baseline, indexing, and submission. Cold-email sign-in resolved. Controlled suppression tests remain required; application timing is no longer the acquisition concern. DNS and controlled sender inbox: needed for mail authentication and actual delivery. Stripe sandbox and test account: needed for safe checkout verification. Owner account ID: needed to enable the new CRM. No passwords belong in chat or these files.

## Approval sequence
1. Review code and local preview. Approve a named deployment only after payment/legal risks and owner configuration are resolved.
2. Review exact prospect records, final messages, sender, postal address, daily limits, and stop rules. Approve sending separately.
3. Review paused Ads configuration, actual budget reconciliation, and tracking evidence. Approve a maximum spend and dates.
4. Review final contractor brief and a fixed paid-test quote within the setup envelope. Approve hiring separately.

## Weekly report
Use METRICS.md. Report shipped changes, spend, leads, calls, revenue, contribution, experiments, risks, and next priorities. Record unknowns explicitly. No recurring monitor was scheduled; this session does not imply future unattended work.

## Work log — September 9, 2026
Inspected three repositories and primary live site. Read relevant Upwork notice. Located starter script. Measured public response times. Prepared capture, CRM, metadata, demo-label, and inbox lifecycle changes. Five isolated capture/authorization tests passed. Account and live integration tests remain separate. See handover for final build status and file application state.

## Final verification status
Primary production build passed. Five isolated capture and owner-authorization tests passed. Fixture form-to-CRM flow passed with a local notification sink, including a saved next action. Mobile homepage layout checked. Cold inbox stale-response regression and minimal-token tests passed. Full cold OAuth, live email delivery, suppression across all send paths, analytics deduplication, and Stripe payment/contract flow remain unverified. Existing Stripe key is live; no live payment was attempted. Configure GROWTH_ADMIN_USER_ID before deployment. Rotate credentials exposed by the former cold OAuth query token and invalidate old tokens; the local patch does not revoke them.

Search draft 10213310599 was created, but Google required a fresh identity check while saving. Do not assume the latest ad edits or budget are persisted until that check and save verification complete. It is unpublished. Existing Performance Max budget was saved and verified at 6.57 USD/day.


## Continued implementation
Google identity verification is resolved. The Search draft now shows All changes saved and Your campaign is ready to publish. Three exact/phrase keywords and the full responsive ad were saved. The draft budget is $4.90/day; the bidding screen shows a $3 maximum CPC limit. It remains unpublished. The live Performance Max campaign remains $6.57/day. Google draft validation does not verify the landing page, lead tracking, or negative keywords; those remain launch gates.

Added a shared suppression check to the common outreach delivery service and all three direct inbox delivery sites, including the delayed send callback. Ten isolated tests passed: legacy mixed-case/whitespace addresses, recipient lists, business-name suppression, literal-name matching, account isolation, allowed delivery, database failure, missing owner, invalid recipient, and opt-out before queued delivery. Four additional files were applied locally, including the tests. No deployment or message was sent. See OUTREACH_SAFETY.patch. Live end-to-end opt-out behavior remains unverified.

The business mailing address has been requested for final outreach preparation. Existing credential rotation, owner CRM configuration, and live staging checks remain required. No revenue or sale has been verified.

## Confirmed data offer and automation — September 10
The owner clarified that Phoenix cleans and organizes client-provided files using Microsoft tools and AI. It does not currently sell data lists or public-record blocks. This supersedes earlier offer assumptions. A quote-based data-cleanup page, services card, and request flow are implemented locally. New legacy data purchases are blocked locally; the old data entry page redirects to cleanup. Production rollout remains pending. A daily 9 a.m. Central operations heartbeat is active; it performs monitoring and authorized preparation, not unapproved sending, purchasing, or deployment. See the session outputs/CURRENT_STATUS.md for the current blockers and verification limits.
