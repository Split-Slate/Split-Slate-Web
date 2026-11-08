import { CheckSquare, Pencil, Trash2 } from "lucide-react";
import type { KeyboardEvent, MouseEvent } from "react";
import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";

import Icon from "@/shared/ui/icon";

interface PropsType {
  expenseName: string;
  x: number;
  y: number;
  returnFocus: HTMLElement | null;
  onClose: () => void;
  onEdit: () => void;
  onSelect: () => void;
  onDelete: () => void;
}

const ExpenseContextMenu = ({
  expenseName,
  x,
  y,
  returnFocus,
  onClose,
  onEdit,
  onSelect,
  onDelete,
}: PropsType) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const pointerStartedInMenuRef = useRef(false);

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const openedAt = performance.now();
    const viewport = window.visualViewport;
    const left = viewport?.offsetLeft ?? 0;
    const top = viewport?.offsetTop ?? 0;
    const width = viewport?.width ?? window.innerWidth;
    const height = viewport?.height ?? window.innerHeight;
    const rect = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(left + 8, Math.min(x + 8, left + width - rect.width - 8))}px`;
    menu.style.top = `${Math.max(top + 8, Math.min(y + 8, top + height - rect.height - 8))}px`;
    menu.style.maxHeight = `${Math.max(0, height - 16)}px`;
    menu.style.maxWidth = `${Math.max(0, width - 16)}px`;
    menu.querySelector<HTMLButtonElement>("[role='menuitem']")?.focus({ preventScroll: true });

    const handleOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !menu.contains(event.target)) onClose();
    };
    const handleScroll = (event: Event) => {
      // Scrolling a row into view can queue an event before its action opens this menu.
      // That already-completed scroll must not dismiss the newly opened menu.
      if (event.timeStamp < openedAt) return;
      if (event.target instanceof Node && menu.contains(event.target)) return;
      onClose();
    };
    const handleResize = (event: Event) => {
      if (event.timeStamp >= openedAt) onClose();
    };
    const handleFocus = (event: FocusEvent) => {
      if (event.timeStamp < openedAt) return;
      if (event.target instanceof Node && !menu.contains(event.target)) onClose();
    };
    document.addEventListener("pointerdown", handleOutside, true);
    document.addEventListener("scroll", handleScroll, true);
    document.addEventListener("focusin", handleFocus);
    window.addEventListener("resize", handleResize);
    viewport?.addEventListener("resize", handleResize);
    viewport?.addEventListener("scroll", handleResize);
    return () => {
      document.removeEventListener("pointerdown", handleOutside, true);
      document.removeEventListener("scroll", handleScroll, true);
      document.removeEventListener("focusin", handleFocus);
      window.removeEventListener("resize", handleResize);
      viewport?.removeEventListener("resize", handleResize);
      viewport?.removeEventListener("scroll", handleResize);
      if (returnFocus?.isConnected && menu.contains(document.activeElement)) {
        returnFocus.focus({ preventScroll: true });
      }
    };
  }, [onClose, returnFocus, x, y]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const menu = menuRef.current;
    if (!menu) return;
    const items = [...menu.querySelectorAll<HTMLButtonElement>("[role='menuitem']")];
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    let next: number;
    if (event.key === "ArrowDown") next = (index + 1) % items.length;
    else if (event.key === "ArrowUp") next = (index - 1 + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    } else if (event.key === "Tab") {
      event.preventDefault();
      onClose();
      return;
    } else return;
    event.preventDefault();
    items[next]?.focus();
  };

  const handleContextMenu = (event: MouseEvent<HTMLDivElement>) => event.preventDefault();
  const handlePointerDown = () => {
    pointerStartedInMenuRef.current = true;
  };
  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    // Releasing the long-press must not activate an item that appeared beneath the finger.
    if (event.detail > 0 && !pointerStartedInMenuRef.current) {
      event.preventDefault();
      event.stopPropagation();
    }
    pointerStartedInMenuRef.current = false;
  };

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={`Actions for ${expenseName}`}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onClickCapture={handleClickCapture}
      onContextMenu={handleContextMenu}
      className="surface fixed z-[100] w-56 overflow-auto p-1.5 shadow-2xl"
    >
      <p className="truncate px-3 py-2 text-xs font-bold text-[var(--muted)]">{expenseName}</p>
      <button
        type="button"
        role="menuitem"
        tabIndex={-1}
        onClick={onEdit}
        className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left hover:bg-[var(--surface-soft)] focus-visible:bg-[var(--surface-soft)]"
      >
        <Icon icon={Pencil} size={18} /> Edit
      </button>
      <button
        type="button"
        role="menuitem"
        tabIndex={-1}
        onClick={onSelect}
        className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left hover:bg-[var(--surface-soft)] focus-visible:bg-[var(--surface-soft)]"
      >
        <Icon icon={CheckSquare} size={18} /> Select
      </button>
      <div className="my-1 border-t border-[var(--line)]" role="separator" />
      <button
        type="button"
        role="menuitem"
        tabIndex={-1}
        onClick={onDelete}
        className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[var(--negative)] hover:bg-[var(--surface-soft)] focus-visible:bg-[var(--surface-soft)]"
      >
        <Icon icon={Trash2} size={18} /> Delete
      </button>
    </div>,
    document.body,
  );
};

export default ExpenseContextMenu;
