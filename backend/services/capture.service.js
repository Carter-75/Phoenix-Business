// Dependencies are injected so tests cannot send mail or use a live database.
function createCaptureHandler({ Request, notify }) {
  return async (req, res) => {
    const body = req.body || {};
    const fields = { name: 120, email: 254, businessName: 200, website: 500, message: 5000 };
    const data = {};
    for (const [key, max] of Object.entries(fields)) {
      if (body[key] != null && typeof body[key] !== 'string') return res.status(400).json({ error: 'Invalid form fields.' });
      data[key] = (body[key] || '').trim();
      if (data[key].length > max) return res.status(400).json({ error: 'A form field is too long.' });
    }
    data.email = data.email.toLowerCase();
    if (!data.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return res.status(400).json({ error: 'Enter your name and a valid email.' });
    if (data.website) {
      try { if (!['http:', 'https:'].includes(new URL(data.website).protocol)) throw new Error(); }
      catch { return res.status(400).json({ error: 'Use a full website address starting with https://.' }); }
    }
    const attribution = {};
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']) {
      const value = body.attribution?.[key];
      if (typeof value === 'string' && /^[a-zA-Z0-9_.-]{1,100}$/.test(value)) attribution[key] = value;
    }
    let record;
    try { record = await Request.create({ ...data, attribution }); }
    catch { return res.status(503).json({ error: 'Your request was not saved. Please try again.' }); }
    // A saved request remains in the CRM if SMTP fails. Never return a false save failure.
    let notification = 'pending';
    try {
      await notify(data);
      notification = 'sent';
      await Request.updateOne({ _id: record._id }, { $set: { notification } });
    } catch { /* The CRM exposes pending notifications for manual recovery. */ }
    return res.status(201).json({ status: 'saved', requestId: String(record._id), notification, message: 'Your request is saved.' });
  };
}
module.exports = { createCaptureHandler };
