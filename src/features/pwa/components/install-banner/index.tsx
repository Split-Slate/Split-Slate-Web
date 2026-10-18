import { Download } from "lucide-react";

import AppNotice from "@/shared/ui/app-notice";

interface PropsType {
  visible: boolean;
  postImport: boolean;
  instructions: boolean;
  pending: boolean;
  onInstall: () => void;
  onClose: () => void;
}

const InstallBanner = ({
  visible,
  postImport,
  instructions,
  pending,
  onInstall,
  onClose,
}: PropsType) => {
  if (!visible) return null;

  const agent = navigator.userAgent;
  const isAppleMobile =
    /iPhone|iPad|iPod/i.test(agent) ||
    (agent.includes("Macintosh") && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(agent);

  return (
    <AppNotice
      title={
        postImport ? "Your group is ready. Keep Split Slate handy." : "Take Split Slate with you"
      }
      description={
        postImport
          ? "Group imported. Add Split Slate to your home screen for easy access."
          : "Add it to your home screen for quick access and offline use. No app store needed."
      }
      icon={Download}
      actionLabel={pending ? "Opening…" : postImport ? "Install app" : "Install"}
      closeLabel="Close install message"
      onAction={onInstall}
      onClose={onClose}
      pending={pending}
    >
      {instructions && (
        <p role="status" className="app-notice-instructions">
          {isAppleMobile
            ? "Open your browser’s Share menu, then choose Add to Home Screen. If that option is missing, open this page in Safari and use Share → Add to Home Screen."
            : isAndroid
              ? "Open your browser’s menu (⋮), then choose Install app or Add to Home screen."
              : "Open your browser’s menu or the install icon in the address bar, then choose Install Split Slate."}
        </p>
      )}
    </AppNotice>
  );
};

export default InstallBanner;
