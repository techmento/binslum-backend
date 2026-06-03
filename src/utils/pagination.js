const { PAGINATION } = require('../config/constants');

const getPagination = (query) => {
  let page = parseInt(query.page, 10) || PAGINATION.DEFAULT_PAGE;
  let limit = parseInt(query.limit, 10) || PAGINATION.DEFAULT_LIMIT;

  // Enforce constraints
  if (page < 1) page = PAGINATION.DEFAULT_PAGE;
  if (limit < 1) limit = PAGINATION.DEFAULT_LIMIT;
  if (limit > PAGINATION.MAX_LIMIT) limit = PAGINATION.MAX_LIMIT;

  const skip = (page - 1) * limit;

  return { skip, take: limit, page, limit };
};

const getPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    total_pages: totalPages,
    has_next: page < totalPages,
    has_prev: page > 1,
  };
};

module.exports = {
  getPagination,
  getPaginationMeta,
};
