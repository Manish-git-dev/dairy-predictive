import { useState, useEffect, useCallback } from 'react';

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
        const errMsg = err.response?.data?.message || err.message || 'Error fetching data';
        setError(errMsg);
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
