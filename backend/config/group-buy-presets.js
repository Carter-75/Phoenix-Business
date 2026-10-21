/**
 * The 10 group buy events the rotation cycles through. Order in this
 * file means nothing: the rotation shuffles the keys, runs each event
 * once per cycle in that random order, then reshuffles. Events appear
 * on their own after a random gap (see group-buy.service rotation).
 *
 * Every preset sells the same kind of thing (a capped high-percent
 * discount), with different numbers and framing so regulars do not see
 * the identical offer twice in a row. All copy follows the tone rules:
 * honest counts, a real capacity reason, no hype.
 */
const PRESETS = [
  {
    key: 'neighborhood',
    name: 'Neighborhood Group Buy',
    percentOff: 90, joinPriceCents: 10000, slotsNeeded: 10, windowDays: 6,
    capSetupCents: 100000, capMonthlyCents: 1000, redeemWindowDays: 90,
    capacityReason: 'Ten is one full build block: that many sites is what can be built at once, which is what makes the group price possible.'
  },
  {
    key: 'main-street-five',
    name: 'Main Street Five',
    percentOff: 80, joinPriceCents: 7500, slotsNeeded: 5, windowDays: 4,
    capSetupCents: 100000, capMonthlyCents: 1500, redeemWindowDays: 90,
    capacityReason: 'Five local businesses splitting one build block is what makes this price possible.'
  },
  {
    key: 'weekend-sprint',
    name: 'Weekend Sprint Group Buy',
    percentOff: 90, joinPriceCents: 12500, slotsNeeded: 8, windowDays: 3,
    capSetupCents: 125000, capMonthlyCents: 1000, redeemWindowDays: 90,
    capacityReason: 'Eight spots fill one focused build block, so the group rate can be this deep.'
  },
  {
    key: 'small-town-seven',
    name: 'Small Town Seven',
    percentOff: 70, joinPriceCents: 5000, slotsNeeded: 7, windowDays: 5,
    capSetupCents: 75000, capMonthlyCents: 1000, redeemWindowDays: 90,
    capacityReason: 'Seven businesses in one build block keeps the schedule sane and the price low.'
  },
  {
    key: 'local-legends',
    name: 'Local Legends Group Buy',
    percentOff: 90, joinPriceCents: 15000, slotsNeeded: 10, windowDays: 7,
    capSetupCents: 150000, capMonthlyCents: 2500, redeemWindowDays: 90,
    capacityReason: 'A full block of ten builds is the biggest batch that can be delivered well, so this one carries the largest caps.'
  },
  {
    key: 'coffee-shop-circle',
    name: 'Coffee Shop Circle',
    percentOff: 80, joinPriceCents: 6000, slotsNeeded: 6, windowDays: 4,
    capSetupCents: 90000, capMonthlyCents: 1200, redeemWindowDays: 90,
    capacityReason: 'Six spots is a comfortable build block, and the group rate reflects that.'
  },
  {
    key: 'fall-build-block',
    name: 'Fall Build Block',
    percentOff: 85, joinPriceCents: 10000, slotsNeeded: 8, windowDays: 6,
    capSetupCents: 110000, capMonthlyCents: 1500, redeemWindowDays: 90,
    capacityReason: 'Eight builds in one scheduled block is what makes the group price possible.'
  },
  {
    key: 'downtown-ten',
    name: 'Downtown Ten',
    percentOff: 90, joinPriceCents: 10000, slotsNeeded: 10, windowDays: 5,
    capSetupCents: 100000, capMonthlyCents: 2000, redeemWindowDays: 90,
    capacityReason: 'Ten downtown businesses in one build block is what makes this price possible.'
  },
  {
    key: 'first-five',
    name: 'First Five Group Buy',
    percentOff: 80, joinPriceCents: 8000, slotsNeeded: 5, windowDays: 3,
    capSetupCents: 100000, capMonthlyCents: 1000, redeemWindowDays: 90,
    capacityReason: 'A small block of five builds can start sooner, which is what this group price reflects.'
  },
  {
    key: 'workshop',
    name: 'Workshop Group Buy',
    percentOff: 70, joinPriceCents: 5000, slotsNeeded: 6, windowDays: 7,
    capSetupCents: 80000, capMonthlyCents: 1000, redeemWindowDays: 90,
    capacityReason: 'Six workshop builds in one block keeps quality up and the group price down.'
  }
];

function shuffledKeys(rand = Math.random) {
  const keys = PRESETS.map(p => p.key);
  for (let i = keys.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [keys[i], keys[j]] = [keys[j], keys[i]];
  }
  return keys;
}

function getPreset(key) {
  return PRESETS.find(p => p.key === key) || null;
}

module.exports = { PRESETS, shuffledKeys, getPreset };
