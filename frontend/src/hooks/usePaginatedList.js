import { useState, useCallback, useEffect } from 'react';
import { useApiClient } from '../api/client';

/**
 * usePaginatedList hook
 * Consolidates pagination, search, and loading state for list endpoints.
 *
 * @param {string} endpoint - API endpoint path (e.g., '/api/patients')
 * @param {Object} options - { defaultLimit, cacheKey, staticFilters }
 * @returns {Object} {
 *   items, pagination, loading, error, searchQuery, setSearchQuery,
 *   setPage, setLimit, refetch, clearFilters
 * }
 */
export function usePaginatedList(endpoint, options = {}) {
  const { defaultLimit = 10, cacheKey, staticFilters = {} } = options;
  const api = useApiClient();

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: defaultLimit, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQueryState] = useState('');
  const [filters, setFilters] = useState(staticFilters);

  const setPage = useCallback((page) => {
    setPagination((p) => ({ ...p, page }));
  }, []);

  const setLimit = useCallback((limit) => {
    setPagination((p) => ({ ...p, limit, page: 1 }));
  }, []);

  const setSearchQuery = useCallback((query) => {
    setSearchQueryState(query);
    setPage(1); // Reset to first page on search
  }, [setPage]);

  const setFilter = useCallback((key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1); // Reset to first page on filter change
  }, [setPage]);

  const clearFilters = useCallback(() => {
    setFilters(staticFilters);
    setSearchQueryState('');
    setPage(1);
  }, [staticFilters, setPage]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(searchQuery && { search: searchQuery }),
        ...filters
      };
      // Remove undefined/null params
      Object.keys(params).forEach((k) => (params[k] == null && delete params[k]));
      const res = await api.get(endpoint, { params });
      if (res.data.data) {
        setItems(res.data.data);
        setPagination((p) => ({ ...p, ...res.data.pagination }));
      } else {
        setItems(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [api, endpoint, pagination.page, pagination.limit, searchQuery, filters]);

  // Auto-refetch when dependencies change
  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    items,
    pagination,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    setPage,
    setLimit,
    setFilter,
    clearFilters,
    refetch
  };
}
