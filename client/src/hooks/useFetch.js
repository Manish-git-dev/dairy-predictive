import { useState, useEffect, useCallback } from 'react';

const getErrorMessage = (error) => (
  error?.userMessage
  || error?.response?.data?.error?.message
  || error?.response?.data?.message
  || error?.message
  || 'Error fetching data'
);

export const useFetch = (fetchFn, params = {}, immediate = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (overrideParams = null) => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = overrideParams !== null ? overrideParams : params;
        const response = await fetchFn(queryParams);
        const result = response && response.data !== undefined ? response.data : response;
        setData(result);
        return result;
      } catch (err) {
        const normalizedError = {
          message: getErrorMessage(err),
          status: err?.status || err?.response?.status || null,
          code: err?.response?.data?.error?.code || null,
          requestId: err?.requestId || err?.response?.data?.error?.requestId || null,
          original: err,
        };
        setError(normalizedError);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchFn, JSON.stringify(params)]
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    data,
    loading,
    error,
    refetch: execute,
  };
};

export default useFetch;
