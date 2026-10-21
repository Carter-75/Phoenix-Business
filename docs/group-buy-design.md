# Group Buy Event: Design and Build Plan

Status: BUILT Oct 21, 2026 (Carter approved with a product change; see v2
below). The original design follows for the record.

## v2: Final product definition (Carter, Oct 21, 2026) and what was built

The group buy does not sell a website or a slot in a build queue. It sells
a DISCOUNT: a high percentage off with a dollar cap, issued as a personal
coupon when the group fills. Final default numbers, all adjustable per
event in the owner secret menu:

- Join price $100, slots needed 10, event window 6 days (3 also fine;
  admin picks 1 to 30), discount 90% off, applied to at most $1,000 of
  the setup price and at most $10 of the monthly price, redeem within
  90 days, one per account, tied to the buyer's account.
- Mechanic: SetupIntent saves the card at join (Stripe's documented
  pattern for charge-later-if-threshold-met). On a fill, the $100 join
  price is charged off-session and a Coupon of the new type
  percentage_capped is minted per buyer (amount 90, capSetupCents
  100000, capMonthlyCents 1000, bypassFloors true, issuedToUserId set,
  usageLimit 1). On a miss, nothing is charged, ever.
- The capped formula is pct off min(subtotal, cap), verified against
  Carter's own examples: $1,100 at 90% up to $1,000 takes $900 off and
  leaves $200; $11/mo at 90% up to $10 takes $9 off and leaves $2.
- The maximum any code can ever take is $900 off setup plus $9 a month,
  no matter what the buyer configures. bypassFloors skips the normal
  $799 setup / $49 monthly PRICING_FLOORS for these coupons only, per
  Carter's "no minimum" instruction; the pricing engine harness
  (14 checks) proves the caps bind, the floors clamp without the flag,
  and Enterprise discounts stay at exactly the caps.
- Unit economics at the normal 20% promo (coupons apply after the
  site-wide promo, like every coupon on this platform): a Starter buyer
  who redeems pays $100 join + $299.20 setup + $70.20/mo, which is
  $1,241.60 of real payments in year 1 against at most $1,008 of list
  discount surrendered. Every tier is cash-positive in every scenario;
  the only real cost is discounted margin and build time. Note: while a
  deeper seasonal promo runs (35% was live during the build), redemption
  totals drop further (Starter setup $97.43); the caps still bound the
  coupon itself.
- A buyer whose fill charge declines gets a 7-day fix window (Checkout
  link at the join price); the group still completes without them.
- Sweeps ride inside the existing daily-renewals cron. Admin lives in
  the owner secret menu's Group Buy tab. Public page: /group-buy with
  the honest counter and the full terms box above the join button.

## v1 design (superseded product definition, kept for the record)

## Tone rules (Carter, hard constraints)

- One event at a time, modest slot counts, occasional. The event is a side
  door; the regular site and normal pricing stay the main story.
- Presented as businesses banding together for a better group price. No hype,
  no casino energy, no pressure tactics.
- No fake scarcity, no inflated "was" prices, no resetting or ticking
  countdown pressure, no dark patterns. If the honest version of an element
  feels like a pressure tactic, the element is cut.
- The deadline is shown as a plain date and time with timezone. The counter
  shows only real joins.

## What the research says (Oct 21, 2026; full report in the research notes)

- Groupon's original model tipped at a set participant count by midnight,
  else the deal expired with no money changing hands (Harvard Business
  Review). Kickstarter locks the goal and deadline at launch, charges nobody
  if the goal is missed, and advises the goal be the amount actually needed.
  Indiegogo's current platform is fixed-funding only, with automatic returns
  on a miss.
- Stripe's own documented pattern for "a crowdfunding website that collects
  card details to be charged later, only if the campaign reaches a certain
  amount" is the SetupIntent: save the card with clear mandate terms, charge
  only when the threshold is met. No hold, no expiry clock.
- Real card authorization holds expire in 7 days per buyer (Visa, Mastercard,
  Amex, Discover, card-not-present). Holds also reduce a debit card's
  available balance immediately, and statements often do not distinguish a
  hold from a charge, which confuses customers. Extended authorizations up
  to 30 days exist but are gated and not guaranteed.
- Charging a deposit up front avoids expiry, but on failure every refund
  takes about 5 to 10 business days to appear, and Stripe does not return
  its processing fee on refunds.
- Real group pricing for services sits in a 10 to 25 percent band (MIT Sloan
  10 to 15 percent, BU CADER 10 to 20 percent by group size, Stanford GSB up
  to 15 percent, DALE up to 25 percent). Groupon's 50 percent mode is the
  outlier, and small cohorts cap around 10 people.
- PledgeMe's pacing marks: about 10 percent in 48 hours and 30 percent by
  week 1 is the tipping zone, so pre-recruiting roughly the first third
  before the public clock starts is the legitimate way these succeed.
- Trust is built by: the whole mechanic stated before anyone hands over a
  card, exact release/refund mechanics, an honest live counter, a named
  organizer, free cancellation in the same medium, and substantive updates.
- FTC lines not to cross: the FTC Act section 5 and the FTC's 2022 dark
  patterns report treat baseless countdowns, false scarcity, false discount
  claims, buried material terms, and hard cancellation as deception. The
  Deceptive Pricing Guides (16 CFR Part 233) require a "was" price to be a
  bona fide price openly offered for a reasonably substantial period. Gift
  card rules (CARD Act) and the Groupon voucher settlement say: never let a
  paid-value voucher expire on a short clock, so the deliverable is the
  website package itself, never an expiring credit.

## Recommendation: SetupIntent (save card, charge on fill)

Two mechanics were compared against the evidence:

### A. SetupIntent, charge on fill (RECOMMENDED)

- Joining saves the buyer's card with Stripe under explicit mandate terms
  shown before they confirm: the exact amount, that it is a one-time charge,
  and that it runs only if the group fills by the deadline.
- No money moves and no hold sits on anyone's card while the event runs, so
  the window is free: 14 to 21 days is calm and realistic, no 7-day cliff.
- On fill, the backend charges each saved card off-session. On a miss,
  nothing happens at all: no charges, no releases, no refunds, just a
  same-day email saying the group did not fill and your card was not charged.
- The honest cost: an off-session charge can decline. Mitigation, following
  Kickstarter's practice: once the group has filled and been announced, it
  runs. A buyer whose charge fails gets a 7-day fix-payment window (a normal
  checkout link at the group price) with reminders. If they never fix it,
  they drop out and the rest of the group is unaffected.
- This is also the mechanic Stripe itself documents for this exact case,
  which matters for disputes and account health.

### B. Manual capture holds (the earlier draft)

- Joining authorizes the group price; capture on fill; cancel on miss.
- Stronger guarantee that the money is there (the hold already reserves it),
  but: the whole event must fit inside 7 days from the first join, debit
  buyers see their available balance drop for the duration, statements can
  make the hold look like a charge, and buyer support questions land on
  Carter. The short window also reads as urgency even when it is honest.

Deposit-up-front was rejected in the first pass and the research confirms
why: real charges during the event, 5 to 10 day refunds on a miss, and
non-refunded Stripe fees on every failed event.

## Event model

- GroupBuyEvent: name, tierId (priced by backend/services/pricing.service.js,
  the existing source of truth), slotsNeeded (3 to 10, enforced), the printed
  capacity reason (for example "one full build block"), discountPercent
  (default 20, the honest band is 15 to 20, ceiling 25), baseSetupCents and
  groupSetupCents computed at creation from the pricing service and frozen,
  startsAt, deadline (date, time, timezone shown to buyers), status: draft,
  open, filled, completed, missed, cancelled. Creating an event while
  another is open is refused: one at a time is enforced, not just intended.
  Threshold and deadline lock at launch and cannot be edited while open.
- GroupBuyEntry: event, user (sign-in required, one slot per account),
  stripeCustomerId, setupIntentId, saved payment method, amountCents,
  status: joined, charged, charge_failed, fixing (inside the 7-day window),
  dropped, cancelled_by_buyer. Consent snapshot: the mandate text version
  and the timestamp the buyer accepted it.
- The discount is structural (the event price), and each event also creates
  an internal Coupon (usage limit equals slots, window equals the event) so
  discount reporting and the existing redemption recorder
  (recordDatabaseCouponRedemption in backend/routes/stripe.js) stay the one
  accounting path for the charged buyers and for any fix-payment checkout.

## Price math (with the recommended mechanic)

- Example: Business tier, regular setup $2,499. At 20 percent off the group
  setup price is $1,999.20. Six slots filling charges $11,995.20 in total.
- The discount applies to the setup price only. The monthly care plan stays
  at the regular price, starts when the buyer's charge lands, with the same
  30-day trial the normal checkout offers. After the group charge succeeds,
  the buyer's care subscription is created from the same saved card; if
  that creation fails, they get a checkout link to finish it.
- The "was" price is always the live regular price from the pricing
  service, never a special inflated reference price.

## Pages and flow

1. Event page at /group-buy (only live while an event is open; otherwise a
   quiet "no group buy right now" state with the regular services pitch).
   Content: what the package includes, regular price and group price, the
   threshold with its capacity reason ("6 spots, because that is one full
   build block"), the honest counter ("4 of 6 joined"), the deadline as a
   date and time with timezone, and the terms box (below) rendered above
   the join button. A small banner on the services pages links here while
   an event is open. No countdown widget, no spots-left theatrics beyond
   the plain counter.
2. The terms box, every item visible before joining (Indiegogo's creator
   checklist and the FTC's buried-terms line both point here): regular
   price, group price and the amount saved, how many must join, the
   deadline with timezone, the exact charge moment ("charged only if the
   group fills, at the moment it fills"), how to cancel and the cutoff,
   what happens if the group misses (card never charged, email same day),
   what happens after success (project scheduling, the existing refund
   policy), and the organizer: Phoenix Websites AI, Carter, with contact.
3. Join: sign in, accept the contract terms as in normal checkout, then
   the Stripe card form with the mandate text. Join confirmation email:
   what they joined, the amount that will be charged and when, how to
   cancel, and the deadline.
4. Fill detection: SetupIntent success is confirmed by webhook; the join
   that reaches the threshold flips the event to filled and runs the
   charge sweep. Each successful charge flows into the same finalize path
   as a normal purchase (contract, subscription start, receipt email with
   the group discount shown), and a "the group filled" email goes to all
   buyers. Failed charges move that buyer to the 7-day fix window.
5. Deadline sweep: if the deadline passes unfilled, the event closes as
   missed and every joiner gets the same-day email: the group did not
   fill, your card was not charged, nothing to refund. The sweep rides
   inside the existing daily-renewals cron (both Vercel cron slots are
   taken), with lazy checks on event reads as a backstop.
6. Cancellation: one click from the confirmation email or the dashboard,
   any time while the event is open, no phone call and no retention pitch.
   One disclosed exception, Kickstarter-style: in the last 24 hours,
   cancelling is unavailable if it would drop a filled group below its
   threshold. This is printed in the terms box at join, not discovered
   later.

## Edge cases

- Charge declines at fill: covered above (7-day fix window, group runs).
- A buyer joins twice: one entry per account per event, enforced.
- Webhook retries and double sweeps: every state transition is idempotent,
  using the ProcessedEvent pattern the coupon recorder already uses, so a
  buyer can never be charged twice.
- Event cancelled by Carter mid-run: allowed from the admin tab; joiners
  get the same "not charged" email; nothing was charged, so nothing else
  is owed.
- Card saved but Stripe customer deleted or card removed before fill:
  the fill charge fails and the buyer lands in the fix window like any
  other decline.
- The group fills early: charges run at fill, and the page and emails say
  that is what will happen, in the terms box, before anyone joins.

## Admin

Owner secret menu gains a Group Buy tab beside Coupons: create an event
(tier, slots, discount, deadline, capacity reason), see the join list and
counts, cancel an event. Creation validates the tone rules in code (slots
3 to 10, discount at most 25, no second open event). APIs sit behind the
owner session like the other admin routes.

## Build order (once approved)

1. Models (GroupBuyEvent, GroupBuyEntry) and admin APIs plus the secret
   menu tab.
2. Public event status API and the /group-buy page with the terms box and
   honest counter.
3. Join flow: SetupIntent creation with mandate copy, webhook recording,
   join and cancellation emails.
4. Fill sweep (charge all, finalize purchases, group-filled emails) and
   the deadline sweep inside the daily-renewals cron; fix-payment window
   emails.
5. Dashboard entry for buyers (their group buy status, cancel button,
   fix-payment link when relevant).
6. End-to-end test in Stripe test mode with a 2-slot event before any
   real event is created.

## Decisions for Carter

1. Mechanic: SetupIntent charge-on-fill (recommended) or 7-day holds.
2. Discount preset: 20 percent (recommended, inside the researched honest
   band) or a different fixed number at most 25.
3. Charge-failure policy: group runs once filled, failed buyer gets the
   7-day fix window (recommended), or stricter handling.
4. Approve the design and build order, or change something first.

## v2.1: Rotation, announcements, and the terms update (Carter, Oct 21, 2026)

- Ten preset events live in backend/config/group-buy-presets.js (70 to
  90 percent, $50 to $150 joins, 5 to 10 slots, 3 to 7 day windows,
  varying caps). A rotation state shuffles the ten, opens each once
  per cycle in random order, then reshuffles. After an event closes,
  the next appears after a random 1 to 4 day gap. The owner secret
  menu shows rotation status, the next preset, and a start-now button;
  manual events still work and take precedence while they run.
- When an event opens, every account holder who accepted the current
  terms gets an announcement email. Up to two randomly chosen
  subscribers also receive a one-time, account-bound bonus code
  (10 to 25 percent, 30 days) inside their copy.
- Terms version 2026.6 added Terms section 13 (Group Buys and Event
  Emails). Accepting the terms (at signup, onboarding, or via the new
  banner) is what subscribes an account; acceptance replaces the
  stored acceptance record and re-stamps the time. Existing accounts
  see a non-dismissible banner until they accept. Unsubscribe works
  two ways: reply to any announcement with UNSUBSCRIBE (the daily
  sweep scans the hello@ inbox and honors it) or the one-click link
  in every announcement.
- Verification: a stubbed harness drives the real service through
  rotation (full 10-event cycle, reshuffle), announcements (opt-in
  only, exactly 2 bonus codes), unsubscribe parsing (quoted footers
  do not false-positive), join, fill, decline plus 7-day fix, and a
  missed deadline. 35 of 35 checks pass, plus the 14 of 14 pricing
  harness from v2.
