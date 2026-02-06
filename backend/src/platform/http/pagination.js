function parsePositiveInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parsePagination(query = {}, opts = {}) {
  const defaultLimit = Number.isFinite(opts.defaultLimit) ? opts.defaultLimit : 10;
  const maxLimit = Number.isFinite(opts.maxLimit) ? opts.maxLimit : 100;

  const page = parsePositiveInt(query.page, 1);
  const limitRaw = parsePositiveInt(query.limit, defaultLimit);
  const limit = Math.min(limitRaw, maxLimit);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

function buildPagination({ page, limit, total }) {
  const pages = limit > 0 ? Math.ceil((total || 0) / limit) : 0;
  const hasPrev = page > 1;
  const hasNext = page < pages;
  return { page, limit, total: total || 0, pages, hasPrev, hasNext };
}

module.exports = { parsePagination, buildPagination };
