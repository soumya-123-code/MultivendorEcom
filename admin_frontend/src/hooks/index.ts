import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { useCallback, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { RootState, AppDispatch } from '../store';
import { setPageTitle, setBreadcrumbs } from '../store/slices/uiSlice';

// Typed Redux hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Debounce hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Local storage hook
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T) => {
      try {
        setStoredValue(value);
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error('Error saving to localStorage', error);
      }
    },
    [key]
  );

  return [storedValue, setValue];
}

// Page setup hook
export function usePageSetup(title: string, breadcrumbs?: Array<{ label: string; path?: string }>) {
  const dispatch = useAppDispatch();
  const location = useLocation();

  useEffect(() => {
    dispatch(setPageTitle(title));
    if (breadcrumbs) {
      dispatch(setBreadcrumbs(breadcrumbs));
    } else {
      // Generate breadcrumbs from path
      const pathParts = location.pathname.split('/').filter(Boolean);
      const generatedBreadcrumbs = pathParts.map((part, index) => ({
        label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
        path: index < pathParts.length - 1 ? '/' + pathParts.slice(0, index + 1).join('/') : undefined,
      }));
      dispatch(setBreadcrumbs([{ label: 'Home', path: '/' }, ...generatedBreadcrumbs]));
    }
  }, [dispatch, title, location.pathname]);
}

// Confirmation dialog hook
export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    title: 'Confirm',
    message: 'Are you sure?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
  });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback(
    (options?: Partial<typeof config>): Promise<boolean> => {
      setConfig({ ...config, ...options });
      setIsOpen(true);
      return new Promise((resolve) => {
        resolveRef.current = resolve;
      });
    },
    [config]
  );

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    resolveRef.current?.(true);
  }, []);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    resolveRef.current?.(false);
  }, []);

  return {
    isOpen,
    config,
    confirm,
    handleConfirm,
    handleCancel,
  };
}

// Query params hook
export function useQueryParams() {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);

  const getParam = useCallback(
    (key: string) => queryParams.get(key),
    [queryParams]
  );

  const setParam = useCallback(
    (key: string, value: string | null) => {
      if (value === null) {
        queryParams.delete(key);
      } else {
        queryParams.set(key, value);
      }
      navigate({ search: queryParams.toString() }, { replace: true });
    },
    [queryParams, navigate]
  );

  const setParams = useCallback(
    (params: Record<string, string | null>) => {
      Object.entries(params).forEach(([key, value]) => {
        if (value === null) {
          queryParams.delete(key);
        } else {
          queryParams.set(key, value);
        }
      });
      navigate({ search: queryParams.toString() }, { replace: true });
    },
    [queryParams, navigate]
  );

  return { queryParams, getParam, setParam, setParams };
}

// Previous value hook
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

// Window size hook
export function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

// Mobile detection hook
export function useIsMobile() {
  const { width } = useWindowSize();
  return width < 900;
}

// Click outside hook
export function useClickOutside(ref: React.RefObject<HTMLElement>, handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}
