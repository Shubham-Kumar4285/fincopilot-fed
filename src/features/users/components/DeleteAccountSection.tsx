import { Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/ui/Button";

import { useRequestDeleteCodeMutation } from "../api";
import { useCooldown } from "../use-cooldown";
import { DeleteAccountDialog } from "./DeleteAccountDialog";
import { ProfileSection } from "./ProfileSection";

export function DeleteAccountSection({ email }: { email: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const sendCode = useRequestDeleteCodeMutation();
  const cooldown = useCooldown(60);

  // The code request doubles as the pre-check: a 409 lists workspaces to hand over first.
  const requestCode = () => {
    sendCode.mutate(undefined, { onSuccess: () => { cooldown.start(); } });
  };
  return (
    <ProfileSection
      title="Delete account"
      description="Delete your account and leave your workspaces. You can restore it within 30 days."
    >
      <div>
        <Button
          variant="destructive"
          onClick={() => {
            setIsOpen(true);
            requestCode();
          }}
        >
          <Trash2 size={16} aria-hidden /> Delete account
        </Button>
      </div>
      <DeleteAccountDialog
        open={isOpen}
        email={email}
        sendCode={sendCode}
        onRequestCode={requestCode}
        cooldownSeconds={cooldown.secondsLeft}
        onClose={() => {
          sendCode.reset();
          setIsOpen(false);
        }}
      />
    </ProfileSection>
  );
}
