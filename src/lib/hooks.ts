"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { get, errMsg, type Meta } from "./api";

/** GET ডেটা আনে, query বদলালে আবার আনে */
export function useApi<T>(path: string | null, query?: Record<string, string | number | boolean | undefined | null>) {
  const [data, setData] = useState<T | null>(null);
  const [meta, setMeta] = useState<Meta | undefined>();
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(query || {});

  const load = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    try {
      const r = await get<T>(path, JSON.parse(key));
      setData(r.data);
      setMeta(r.meta);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [path, key]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, meta, loading, reload: load, setData };
}

export function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
