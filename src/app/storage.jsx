import { useEffect, useState } from "react";

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// État React synchronisé avec localStorage (se recharge si la clé change)
export function useStored(key, fallback) {
  const [state, setState] = useState(() => ({
    key,
    value: read(key, fallback),
  }));
  let current = state;
  if (state.key !== key) {
    current = { key, value: read(key, fallback) };
    setState(current);
  }

  useEffect(() => {
    localStorage.setItem(state.key, JSON.stringify(state.value));
  }, [state]);

  const setValue = (updater) =>
    setState((s) => ({
      key: s.key,
      value: typeof updater === "function" ? updater(s.value) : updater,
    }));

  return [current.value, setValue];
}

export const uid = () => Math.random().toString(36).slice(2, 10);
