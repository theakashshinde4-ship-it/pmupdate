/**
 * Pagination Utilities
 * Centralized pagination logic
 */

/**
 * Parse pagination parameters from query
 */
function parsePagination(query, options = {}) {
  const defaultLimit = options.defaultLimit || 10;
  const maxLimit = options.maxLimit || 100;

  let page = parseInt(query.page) || 1;
  let limit = parseInt(query.limit) || defaultLimit;

  // Validation
  page = Math.max(1, page);
  limit = Math.min(Math.max(1, limit), maxLimit);

  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Build pagination metadata for response
 */
function buildPagination(data) {
  const { page, limit, total, offset } = data;

  return {
    page,
    limit,
    total,
    offset,
    pages: Math.ceil(total / limit),
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1
  };
}

/**
 * Build pagination response
 */
function paginatedResponse(data, total, page, limit) {
  return {
    success: true,
    data,
    pagination: buildPagination({ page, limit, total }),
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  parsePagination,
  buildPagination,
  paginatedResponse
};
