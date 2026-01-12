import { useState, useEffect, useCallback } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiOptions {
  immediate?: boolean;
}

export function useApi<T, P = void>(
  apiCall: (params: P) => Promise<T>,
  options: UseApiOptions = { immediate: false }
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: options.immediate || false,
    error: null,
  });

  const execute = useCallback(async (params?: P) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiCall(params as P);
      setState({ data: response, loading: false, error: null });
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      throw err;
    }
  }, [apiCall]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

export function useApiQuery<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await apiCall();
      setState({ data: response, loading: false, error: null });
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, [apiCall]);

  useEffect(() => {
    refetch();
  }, dependencies);

  return { ...state, refetch };
}

export function usePaginatedApi<T>(
  apiCall: (params: { page: number; page_size: number; [key: string]: any }) => Promise<{ results: T[]; count: number }>,
  initialParams: { [key: string]: any } = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [params, setParams] = useState(initialParams);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiCall({ page: page + 1, page_size: pageSize, ...params });
      setData(response.results);
      setTotalCount(response.count);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiCall, page, pageSize, params]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const handlePageChange = (newPage: number) => setPage(newPage);
  const handlePageSizeChange = (newPageSize: number) => { setPageSize(newPageSize); setPage(0); };
  const updateParams = (newParams: { [key: string]: any }) => { setParams((prev) => ({ ...prev, ...newParams })); setPage(0); };

  return { data, totalCount, loading, error, page, pageSize, handlePageChange, handlePageSizeChange, updateParams, refetch: fetch };
}

export function useMutation<T, P>(
  apiCall: (params: P) => Promise<T>,
  options?: { onSuccess?: (data: T) => void; onError?: (error: string) => void }
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (params: P) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiCall(params);
      options?.onSuccess?.(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      options?.onError?.(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall, options]);

  return { mutate, loading, error };
}