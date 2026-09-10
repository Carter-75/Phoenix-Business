# Measurement
Reporting timezone: America/Chicago. Baseline window: August 11–September 9, 2026. No account-level report was accessible for this window. All historical values below are UNKNOWN, not zero.
Traffic; submitted requests; qualified leads; booked calls; attended calls; proposals; wins; close rate; cost per lead; cost per booked call; collected revenue; gross contribution; funnel rates: UNKNOWN.

## Definitions and sources
Visitor: analytics session, excluding staff/test traffic. Lead: unique real person with a saved inquiry. Qualified lead: US owner/decision-maker with a relevant need, at least $500 budget, and feasible scope. Booked call: mutually agreed time. Attended call: conversation occurred. Won: agreed scope plus actual paid deposit. Revenue: collected payment less refunds; report taxes separately. Gross contribution: collected revenue less processing, delivery labor, contractors, hosting allocation, and acquisition cost. Show founder labor separately if not paid in cash.
Lead rate = unique leads / eligible sessions. Close rate = won / qualified attended calls in a matured cohort. Cost per lead = channel spend / unique attributed leads. Cost per booked call = channel spend / unique booked calls. If denominator is zero, report not applicable; do not divide by zero. Separate marketing cash cost from founder research hours.

## Implemented integration point
On a successful durable form save, the page pushes audit_request_saved with offer=website_audit to dataLayer. It sends no name, email, message, or website to that event. Four bounded UTM labels are stored with the request. UTM means a campaign label in the link. No analytics collector or Google Ads conversion action is configured yet. Never call the event a verified Google conversion.
Proposed primary Ads event: qualified_call, recorded only after owner qualification. audit_request_saved is secondary. Do not count button clicks as booked calls. Import offline outcomes only after configuring lawful data handling and identifiers. No click ID capture or offline import is implemented yet.

## Configuration and verification still required
Identify the current GA4/GTM property and Ads conversion actions before adding tags. Use one conversion path, not both direct Ads and imported GA4 for the same lead. Connect the custom dataLayer event after consent choices are defined. Verify one event for a successful submit, zero for validation/save failure, and no duplicate on refresh. Test with Tag Assistant and the actual Ads diagnostics. Keep staff tests out of bidding.
Audit Ads window: last 30 days plus all-time since launch. Export campaigns, costs, search terms, keywords/match types, negatives, location report, conversion actions, quality scores when available, and change history. Reconcile to billing before calculating remaining budget.

## Weekly report template
Week ending; changes shipped; cash spend by channel; existing software; founder hours; sessions; saved requests; qualified leads; booked/attended calls; proposals; wins; collected revenue; refunds; contribution; experiment decision; risks; next three actions. Include source and attribution confidence for each metric. Keep private prospect and customer data outside these documents.

## Verified same-day Ads snapshot
Account using hello@phoenixwebsites.ai; campaign Custom Website Design; reporting display “All time”, September 9, 2026. Impressions 0; clicks 0; cost $0.00; conversion action Subscribe 0.00. These are observed account values, not a 30-day business baseline. The conversion uses the post-purchase review page as a purchase proxy; it is not an audit-lead metric. The owner clarified the checkout flow, which the source code confirms. Repeat review-page visits are possible. Paid transaction linkage and deduplication remain unverified. Keep historical business revenue and qualified-call rates UNKNOWN.

