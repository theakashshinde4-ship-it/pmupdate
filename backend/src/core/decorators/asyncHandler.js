/**
 * Async Handler Decorator
 * Wraps async route handlers to catch errors automatically
 * 
 * Before:
 * router.get('/:id', async (req, res) => {
 *   try {
 *     const patient = await getPatient(req.params.id);
 *     res.json(patient);
 *   } catch (error) {
 *     res.status(500).json({ error: error.message });
 *   }
 * });
 * 
 * After:
 * router.get('/:id', asyncHandler(async (req, res) => {
 *   const patient = await getPatient(req.params.id);
 *   res.json(patient);
 * }));
 */

/**
 * @param {Function} fn - Async route handler
 * @returns {Function} - Wrapped handler with error catching
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = { asyncHandler };
