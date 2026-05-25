import { useCallback, useMemo, useState } from 'react';

const DEFAULT_LIMIT = 20;
const LIMIT_OPTIONS = [10, 20, 50, 100];

export function useOffsetPagination(initialLimit = DEFAULT_LIMIT) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);

  const offset = useMemo(() => (page - 1) * limit, [page, limit]);

  const onPrev = useCallback(() => {
    setPage((current) => Math.max(1, current - 1));
  }, []);

  const onNext = useCallback(() => {
    setPage((current) => current + 1);
  }, []);

  const onLimitChange = useCallback((nextLimit: number) => {
    setLimit(nextLimit);
    setPage(1);
  }, []);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  return {
    page,
    limit,
    offset,
    limitOptions: LIMIT_OPTIONS,
    onPrev,
    onNext,
    onLimitChange,
    resetPage,
  };
}
