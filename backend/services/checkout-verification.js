function createCheckoutVerification(stripe) {
  return async (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!req.isAuthenticated?.() || !req.user?._id) return res.status(401).json({ error: 'Sign in to view your payment.' });
    const id = req.query.session_id;
    if (typeof id !== 'string' || !/^cs_(live|test)_[a-zA-Z0-9]{8,220}$/.test(id)) return res.status(400).json({ error: 'Invalid checkout reference.' });
    try {
      const session = await stripe.checkout.sessions.retrieve(id);
      if (session.metadata?.userId !== String(req.user._id)) return res.status(404).json({ error: 'Checkout not found.' });
      if (session.status !== 'complete' || session.payment_status !== 'paid' || !Number.isSafeInteger(session.amount_total) || session.amount_total <= 0) {
        return res.json({ paid: false });
      }
      if (!/^[a-z]{3}$/i.test(session.currency || '')) return res.status(502).json({ error: 'Payment currency is unavailable.' });
      return res.json({ paid: true, live: session.livemode === true, transactionId: session.id,
        value: session.amount_total / 100, currency: session.currency.toUpperCase() });
    } catch { return res.status(503).json({ error: 'Cannot verify payment yet. Please retry.' }); }
  };
}
module.exports = { createCheckoutVerification };
