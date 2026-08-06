// query.ts
import { shallowRef, type ShallowRef } from "vue";

type Entry<T> = {
  data: ShallowRef<T | undefined>;
  error: ShallowRef<unknown>;
  loading: ShallowRef<boolean>;
  query: () => Promise<T>;
  promise?: Promise<T>;
};

const cache = new Map<string, Entry<any>>();

async function fetch<T>(entry: Entry<T>) {
  // Dedupe concurrent calls
  if (entry.promise) return entry.promise;

  entry.loading.value = true;

  entry.promise = entry
    .query()
    .then((data) => {
      entry.data.value = data;
      entry.error.value = undefined;
      return data;
    })
    .catch((error) => {
      entry.error.value = error;
      throw error;
    })
    .finally(() => {
      entry.loading.value = false;
      entry.promise = undefined;
    });

  return entry.promise;
}

export function useQuery<T>(key: string, query: () => Promise<T>) {
  let entry = cache.get(key) as Entry<T> | undefined;

  if (!entry) {
    entry = {
      data: shallowRef<T>(),
      error: shallowRef(),
      loading: shallowRef(false),
      query,
    };

    cache.set(key, entry);

    // Initial fetch
    void fetch(entry);
  } else {
    // Keep latest query closure
    entry.query = query;
  }

  return {
    data: entry.data,
    error: entry.error,
    loading: entry.loading,
  };
}

export function invalidateQueries(prefix: string) {
  const promises: Promise<unknown>[] = [];

  for (const [key, entry] of cache) {
    if (key.startsWith(prefix)) {
      promises.push(fetch(entry));
    }
  }

  return Promise.all(promises);
}
