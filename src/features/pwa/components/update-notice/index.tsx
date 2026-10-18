import { RefreshCw } from "lucide-react";

import AppNotice from "@/shared/ui/app-notice";

interface PropsType {
  available: boolean;
  onUpdate: () => void;
  onLater: () => void;
}

const UpdateNotice = ({ available, onUpdate, onLater }: PropsType) => {
  if (!available) return null;
  return (
    <AppNotice
      title="A new version of Split Slate is ready"
      description="Save your changes before reloading. Your saved groups stay on this device."
      icon={RefreshCw}
      actionLabel="Update and reload"
      closeLabel="Close update message"
      onAction={onUpdate}
      onClose={onLater}
      kind="update"
    />
  );
};

export default UpdateNotice;
