import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Tiny data-loading hook.
 *
 *   const { data, loading, error, reload, setData } = useAsync(() => api(), [dep]);
 */
export default function useAsync(fn, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState("");
  const mounted = useRef(true);
  const fnRef = useRef(fn);

  // Keep the latest loader without touching refs during render.
  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fnRef.current();
      if (mounted.current) setData(result);
      return result;
    } catch (e) {
      if (mounted.current) setError(e.message);
      throw e;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!immediate) return undefined;
    let cancelled = false;
    const run = async () => {
      try {
        const result = await fnRef.current();
        if (!cancelled) {
          setData(result);
          setError("");
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, reload, setData };
}
