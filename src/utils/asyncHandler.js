// Wraps an async route/middleware handler so any rejected promise or thrown
// error is forwarded to next(err) instead of crashing the request unhandled.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
