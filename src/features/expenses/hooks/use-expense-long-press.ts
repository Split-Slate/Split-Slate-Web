import type { MouseEvent, PointerEvent } from "react";
import { useCallback, useEffect, useRef } from "react";

const LONG_PRESS_DELAY = 500;
const MOVE_TOLERANCE = 10;

export const useExpenseLongPress = (onOpen: (x: number, y: number) => void) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listenerCleanupRef = useRef<(() => void) | null>(null);
  const compatibilityCleanupRef = useRef<(() => void) | null>(null);
  const pointerRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);
  const onOpenRef = useRef(onOpen);

  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  const clearCompatibilityMouse = useCallback(() => {
    compatibilityCleanupRef.current?.();
    compatibilityCleanupRef.current = null;
  }, []);

  const suppressCompatibilityMouse = useCallback(
    (row: HTMLElement) => {
      clearCompatibilityMouse();
      const handleNewIntent = () => {
        suppressClickRef.current = false;
        clearCompatibilityMouse();
      };
      const handleMouseDown = (event: globalThis.MouseEvent) => {
        if (
          suppressClickRef.current &&
          event.target instanceof Node &&
          row.contains(event.target)
        ) {
          // A released touch/pen hold can focus the original link before its click is suppressed.
          event.preventDefault();
        }
        clearCompatibilityMouse();
      };
      document.addEventListener("mousedown", handleMouseDown, true);
      document.addEventListener("pointerdown", handleNewIntent, true);
      document.addEventListener("keydown", handleNewIntent, true);
      compatibilityCleanupRef.current = () => {
        document.removeEventListener("mousedown", handleMouseDown, true);
        document.removeEventListener("pointerdown", handleNewIntent, true);
        document.removeEventListener("keydown", handleNewIntent, true);
      };
    },
    [clearCompatibilityMouse],
  );

  const cancelPress = useCallback(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
    pointerRef.current = null;
    listenerCleanupRef.current?.();
    listenerCleanupRef.current = null;
  }, []);

  useEffect(
    () => () => {
      cancelPress();
      clearCompatibilityMouse();
    },
    [cancelPress, clearCompatibilityMouse],
  );

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    cancelPress();
    clearCompatibilityMouse();
    suppressClickRef.current = false;
    if (!event.isPrimary || event.button !== 0 || event.pointerType === "mouse") return;
    if ((event.target as Element).closest("button, input, select, textarea")) return;
    const { pointerId: id, clientX: x, clientY: y } = event;
    const row = event.currentTarget;
    pointerRef.current = { id, x, y };
    // Only the actively pressed row needs document listeners, even in very long ledgers.
    document.addEventListener("pointerdown", cancelPress, true);
    document.addEventListener("scroll", cancelPress, true);
    document.addEventListener("pointerup", cancelPress, true);
    document.addEventListener("pointercancel", cancelPress, true);
    window.addEventListener("blur", cancelPress);
    listenerCleanupRef.current = () => {
      document.removeEventListener("pointerdown", cancelPress, true);
      document.removeEventListener("scroll", cancelPress, true);
      document.removeEventListener("pointerup", cancelPress, true);
      document.removeEventListener("pointercancel", cancelPress, true);
      window.removeEventListener("blur", cancelPress);
    };
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      suppressClickRef.current = true;
      suppressCompatibilityMouse(row);
      onOpenRef.current(x, y);
    }, LONG_PRESS_DELAY);
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const pointer = pointerRef.current;
    if (
      pointer?.id === event.pointerId &&
      Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > MOVE_TOLERANCE
    ) {
      cancelPress();
    }
  };

  const handlePointerLeave = () => cancelPress();

  const handleContextMenu = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as Element).closest("button, input, select, textarea")) return;
    event.preventDefault();
    const alreadyOpenedByPress = pointerRef.current !== null && suppressClickRef.current;
    cancelPress();
    if (alreadyOpenedByPress) return;
    suppressClickRef.current = true;
    suppressCompatibilityMouse(event.currentTarget);
    const rect = event.currentTarget.getBoundingClientRect();
    onOpenRef.current(event.clientX || rect.left + 24, event.clientY || rect.top + 24);
  };

  const shouldSuppressClick = () => {
    if (!suppressClickRef.current) return false;
    suppressClickRef.current = false;
    clearCompatibilityMouse();
    return true;
  };

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerLeave,
    handleContextMenu,
    shouldSuppressClick,
  };
};
