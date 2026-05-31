import { useCallback, useEffect, useRef } from 'react';

/** Appelle `fn` au plus une fois après `delayMs` sans nouvel appel. */
export function useDebouncedCallback(fn: (() => void) | undefined, delayMs: number) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const debounced = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fnRef.current?.();
    }, delayMs);
  }, [delayMs]);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  return debounced;
}
