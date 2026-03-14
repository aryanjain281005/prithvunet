import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

/**
 * Generic Supabase CRUD hook with local-state fallback.
 * When Supabase is configured, data is loaded from/persisted to the table.
 * When a remote table is empty, it is seeded once with initialData.
 * When Supabase is unavailable or the table is missing, works with local state.
 */
export function useSupabaseCRUD<T extends object>(
  table: string,
  initialData: T[],
  idField: string = "id"
) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);
  const [isRemote, setIsRemote] = useState(false);

  // Load data from Supabase on mount (or fall back to initial)
  useEffect(() => {
    async function load() {
      if (supabase) {
        try {
          const { data: rows, error } = await supabase.from(table).select("*");
          if (!error && rows) {
            if (rows.length > 0) {
              setData(rows as T[]);
              setIsRemote(true);
              setLoading(false);
              return;
            }

            if (initialData.length > 0) {
              const { data: seededRows, error: seedError } = await supabase
                .from(table)
                .insert(initialData as T[])
                .select("*");

              if (!seedError && seededRows) {
                setData(seededRows as T[]);
                setIsRemote(true);
                setLoading(false);
                return;
              }
            }

            setData(rows as T[]);
            setIsRemote(true);
            setLoading(false);
            return;
          }
        } catch {
          // Supabase not reachable — use local data
        }
      }
      setLoading(false);
    }
    load();
  }, [initialData, table]);

  const addItem = useCallback(
    async (item: T) => {
      if (supabase && isRemote) {
        const { data: inserted, error } = await supabase.from(table).insert(item).select().single();
        if (!error && inserted) {
          setData((prev) => [...prev, inserted as T]);
          return;
        }
      }
      setData((prev) => [...prev, item]);
    },
    [table, isRemote]
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<T>) => {
      if (supabase && isRemote) {
        const { error } = await supabase.from(table).update(updates).eq(idField, id);
        if (!error) {
          setData((prev) => prev.map((item) => ((item as Record<string, unknown>)[idField] === id ? { ...item, ...updates } : item)));
          return;
        }
      }
      setData((prev) => prev.map((item) => ((item as Record<string, unknown>)[idField] === id ? { ...item, ...updates } : item)));
    },
    [table, idField, isRemote]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      if (supabase && isRemote) {
        const { error } = await supabase.from(table).delete().eq(idField, id);
        if (!error) {
          setData((prev) => prev.filter((item) => (item as Record<string, unknown>)[idField] !== id));
          return;
        }
      }
      setData((prev) => prev.filter((item) => (item as Record<string, unknown>)[idField] !== id));
    },
    [table, idField, isRemote]
  );

  return { data, setData, loading, isRemote, addItem, updateItem, deleteItem };
}
