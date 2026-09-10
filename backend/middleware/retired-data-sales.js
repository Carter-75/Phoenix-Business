module.exports = function retiredDataSales(req, res, next) {
  const body = req.body || {};
  const buysRecords = body.tier === 'data' || (Array.isArray(body.cartItems) &&
    body.cartItems.some(item => item && (item.type === 'data' || item.tierId === 'data')));
  if (buysRecords) {
    return res.status(410).json({
      error: 'Data-list purchases are no longer offered. Request a quote for work on your own files.',
      requestPath: '/data-cleanup'
    });
  }
  return next();
};
