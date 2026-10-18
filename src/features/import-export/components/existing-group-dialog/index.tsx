import { FolderOpen, TriangleAlert } from "lucide-react";
import type { SyntheticEvent } from "react";
import { useId, useLayoutEffect, useRef } from "react";

import type { Group } from "@/shared/types/domain.types";

import DialogLayout from "@/shared/ui/dialog-layout";
import EmojiImage from "@/shared/ui/emoji-image";
import Icon from "@/shared/ui/icon";

interface PropsType {
  sourceName: string;
  destinationName: string;
  groups: Pick<Group, "id" | "name" | "icon">[];
  onOpenGroup: (groupId: string) => void;
  onImportNew: () => void;
  onCancel: () => void;
}

const ExistingGroupDialog = ({
  sourceName,
  destinationName,
  groups,
  onOpenGroup,
  onImportNew,
  onCancel,
}: PropsType) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (opener instanceof HTMLElement && opener.isConnected)
        opener.focus({ preventScroll: true });
    };
  }, []);

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    onCancel();
  };
  const handleOpenGroup = () => {
    if (groups[0]) onOpenGroup(groups[0].id);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={handleCancel}
      className="app-dialog max-w-lg rounded-3xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-2xl backdrop:bg-black/60"
    >
      <DialogLayout
        title="A group with this name already exists"
        titleId={titleId}
        onClose={onCancel}
        closeLabel="Close matching group message"
        icon={<Icon icon={TriangleAlert} size={26} className="text-[var(--warning-ink)]" />}
        bodyClassName="flex flex-col gap-4"
        footer={
          <div className="existing-group-actions" data-single={groups.length === 1}>
            {groups.length === 1 && (
              <button type="button" className="btn btn-primary" onClick={handleOpenGroup} autoFocus>
                <Icon icon={FolderOpen} size={18} /> Go to existing group
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onImportNew}>
              Import as a new group
            </button>
          </div>
        }
      >
        <p id={descriptionId} className="text-sm leading-relaxed text-[var(--muted)]">
          A group named <strong className="text-[var(--ink)]">{sourceName}</strong> is already saved
          on this device. You may have imported it before.
        </p>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-4">
          {groups.length === 1 ? (
            <div className="flex min-w-0 items-center gap-3">
              <span className="shrink-0" aria-hidden="true">
                <EmojiImage icon={groups[0].icon} />
              </span>
              <div className="min-w-0">
                <p className="break-words font-bold">{groups[0].name}</p>
                <p className="soft-caption mt-1">Continue with your saved expenses and balances.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="soft-caption">Choose a saved group to open:</p>
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onOpenGroup(group.id)}
                >
                  Go to {group.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          Importing again creates a separate group named{" "}
          <strong className="text-[var(--ink)]">{destinationName}</strong>. It won’t update or merge
          with your saved group.
        </p>
      </DialogLayout>
    </dialog>
  );
};

export default ExistingGroupDialog;
