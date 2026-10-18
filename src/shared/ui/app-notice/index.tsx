import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useId } from "react";

import Icon from "@/shared/ui/icon";

interface PropsType {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel: string;
  closeLabel: string;
  onAction: () => void;
  onClose: () => void;
  pending?: boolean;
  kind?: "install" | "update";
  children?: ReactNode;
}

const AppNotice = ({
  title,
  description,
  icon,
  actionLabel,
  closeLabel,
  onAction,
  onClose,
  pending = false,
  kind = "install",
  children,
}: PropsType) => {
  const titleId = useId();

  return (
    <section className="app-notice" data-kind={kind} aria-labelledby={titleId} aria-live="polite">
      <div className="app-notice-inner">
        <span className="app-notice-icon" aria-hidden="true">
          <Icon icon={icon} size={22} />
        </span>
        <div className="app-notice-copy">
          <p id={titleId} className="app-notice-title">
            {title}
          </p>
          <p className="app-notice-description">{description}</p>
          {children}
        </div>
        <div className="app-notice-actions">
          <button
            type="button"
            className="btn btn-primary app-notice-action"
            disabled={pending}
            onClick={onAction}
          >
            {actionLabel}
          </button>
          <button
            type="button"
            className="app-notice-close"
            aria-label={closeLabel}
            onClick={onClose}
          >
            <Icon icon={X} size={20} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default AppNotice;
