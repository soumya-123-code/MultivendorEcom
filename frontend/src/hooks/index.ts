import { useState, useCallback, useEffect, useRef } from 'react';
import { useUI } from '../contexts';

// Simple API query hook - fetches data on mount
export function useApiQuery<T>(
  apiCall: () => Promise<T>,
  dependencies: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiCall();
      if (mountedRef.current) {
        setData(response);
      }
      return response;
    } catch (err: unknown) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    mountedRef.current = true;
    refetch();
    return () => { mountedRef.current = false; };
  }, [refetch]);

  return { data, loading, error, refetch };
}

// Paginated API hook - simple and stable
export function usePaginatedApi<T>(
  apiCall: (params: { page: number; page_size: number; [key: string]: unknown }) => Promise<{ results: T[]; count: number }>,
  initialParams: Record<string, unknown> = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [params, setParams] = useState(initialParams);
  const mountedRef = useRef(true);
  const apiCallRef = useRef(apiCall);
  apiCallRef.current = apiCall;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiCallRef.current({ page: page + 1, page_size: pageSize, ...params });
      if (mountedRef.current) {
        setData(response.results || []);
        setTotalCount(response.count || 0);
      }
    } catch (err: unknown) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [page, pageSize, params]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => { mountedRef.current = false; };
  }, [fetchData]);

  const updateParams = useCallback((newParams: Record<string, unknown>) => {
    setParams(prev => ({ ...prev, ...newParams }));
    setPage(0);
  }, []);

  return {
    data,
    totalCount,
    loading,
    error,
    page,
    pageSize,
    setPage,
    setPageSize: (size: number) => { setPageSize(size); setPage(0); },
    updateParams,
    refetch: fetchData,
  };
}

// Mutation hook for POST/PUT/DELETE
export function useMutation<T, P>(
  apiCall: (params: P) => Promise<T>,
  options?: { onSuccess?: (data: T) => void; onError?: (error: string) => void }
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiCallRef = useRef(apiCall);
  const optionsRef = useRef(options);
  apiCallRef.current = apiCall;
  optionsRef.current = options;

  const mutate = useCallback(async (params: P) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiCallRef.current(params);
      optionsRef.current?.onSuccess?.(response);
      return response;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      optionsRef.current?.onError?.(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error };
}

// Generic async operation hook
export function useAsync<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (asyncFunction: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFunction();
      setData(result);
      return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, execute, setData };
}

// Toast notification hook
export function useToast() {
  const { addNotification } = useUI();

  return {
    success: useCallback((message: string) => addNotification({ message, type: 'success' }), [addNotification]),
    error: useCallback((message: string) => addNotification({ message, type: 'error' }), [addNotification]),
    warning: useCallback((message: string) => addNotification({ message, type: 'warning' }), [addNotification]),
    info: useCallback((message: string) => addNotification({ message, type: 'info' }), [addNotification]),
  };
}

// Pagination hook
export function usePagination(initialPage = 0, initialRowsPerPage = 10) {
  const [page, setPage] = useState(initialPage);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  const handlePageChange = useCallback((newPage: number) => setPage(newPage), []);
  const handleRowsPerPageChange = useCallback((newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  }, []);
  const resetPagination = useCallback(() => setPage(0), []);

  return { page, rowsPerPage, handlePageChange, handleRowsPerPageChange, resetPagination };
}

// Fixed debounce hook - using useEffect instead of useState
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Local storage hook
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error saving to localStorage', error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}
