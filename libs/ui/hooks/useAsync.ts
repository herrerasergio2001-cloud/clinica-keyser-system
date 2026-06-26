import { useEffect, useState, useCallback } from 'react';
import { AsyncState, ApiError } from '@clinic/types';

interface UseAsyncOptions {
  [key: string]: any;
  skip?: boolean;
}

export function useAsync<T>(
  url: string,
  params?: UseAsyncOptions
): AsyncState<T> & { refetch: () => Promise<void> } {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const buildUrl = useCallback((baseUrl: string, searchParams?: UseAsyncOptions) => {
    const urlObj = new URL(baseUrl, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    if (searchParams) {
      const { skip, ...queryParams } = searchParams;
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          urlObj.searchParams.append(key, String(value));
        }
      });
    }
    return urlObj.toString();
  }, []);

  const fetchData = useCallback(async () => {
    if (params?.skip) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const fullUrl = buildUrl(url, params);
      const response = await fetch(fullUrl, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [url, params, buildUrl]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
