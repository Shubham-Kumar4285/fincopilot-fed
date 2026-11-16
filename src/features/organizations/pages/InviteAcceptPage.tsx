import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";

import { useLogoutMutation, useSessionQuery } from "@/features/auth";
import { useMeQuery } from "@/features/users";
import { ApiError, getErrorMessage } from "@/shared/api/errors";
import { PATHS, withNext } from "@/shared/config/paths";
import { maskEmail } from "@/shared/lib/mask-email";
import { Alert } from "@/shared/ui/Alert";
import { Badge } from "@/shared/ui/Badge";
import { buttonClasses } from "@/shared/ui/button-classes";
import { Button } from "@/shared/ui/Button";
import { TableSkeleton } from "@/shared/ui/TableSkeleton";
import { useToast } from "@/shared/ui/toast-context";

import { useAcceptInviteMutation, useInvitePreviewQuery, useSwitchOrg } from "../api";
import type { InvitePreview } from "../api";
import { InviteCard } from "../components/InviteCard";

const ROLE_LABEL: Record<string, string> = { admin: "Admin", member: "Member" };

function daysLeft(expiresAt: string): string {
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
  return days <= 1 ? "Expires today" : `Expires in ${days} days`;
}

export function InviteAcceptPage() {
  const [params] = useSearchParams();
  const token = params.get("token");

  return (
    <main className="px-4 py-12 sm:py-[72px]">
      {token ? (
        <InviteFlow token={token} />
      ) : (
        <InviteCard title="This invite link is incomplete" description="Open the link from your invitation email again." />
      )}
      <p className="mx-auto mt-5 max-w-[440px] text-center text-xs text-secondary">
        Invited email addresses are fixed during sign up to keep workspace access secure.
      </p>
    </main>
  );
}

function InviteFlow({ token }: { token: string }) {
  const preview = useInvitePreviewQuery(token);

  if (preview.isPending) {
    return (
      <div className="mx-auto max-w-[440px] rounded-card border border-line bg-surface">
        <TableSkeleton rows={3} />
      </div>
    );
  }

  if (preview.isError) {
    const status = preview.error instanceof ApiError ? preview.error.status : 0;
    if (status === 404) {
      return <InviteCard title="Invite not found" description="This link isn't valid. Ask the workspace owner to send a new one." />;
    }
    if (status === 400) {
      // Expired or already accepted: the backend message says which.
      return (
        <InviteCard title="Invite no longer available" description={getErrorMessage(preview.error)}>
          <Link to={PATHS.dashboard} className={buttonClasses("secondary", true)}>
            Go to FinCopilot
          </Link>
        </InviteCard>
      );
    }
    return (
      <InviteCard title="We couldn't load this invite" description="Check your connection and try again.">
        <Button variant="secondary" full onClick={() => void preview.refetch()}>
          Try again
        </Button>
      </InviteCard>
    );
  }

  return <InviteDecision token={token} invite={preview.data} />;
}

function InviteDecision({ token, invite }: { token: string; invite: InvitePreview }) {
  const toast = useToast();
  const session = useSessionQuery();
  const isAuthed = session.data === true;
  const me = useMeQuery({ enabled: isAuthed });
  const accept = useAcceptInviteMutation();
  const switchOrg = useSwitchOrg();
  const logout = useLogoutMutation();

  const here = `${PATHS.inviteAccept}?token=${encodeURIComponent(token)}`;
  const role = ROLE_LABEL[invite.role] ?? invite.role;
  const meta = (
    <div className="flex items-center gap-2 text-xs text-secondary">
      <Badge>{role}</Badge>
      <span>{daysLeft(invite.expires_at)}</span>
    </div>
  );

  if (session.isPending || (isAuthed && me.isPending)) {
    return (
      <div className="mx-auto max-w-[440px] rounded-card border border-line bg-surface">
        <TableSkeleton rows={3} />
      </div>
    );
  }

  if (!isAuthed) {
    const signupHref = `${PATHS.signup}?email=${encodeURIComponent(invite.email)}&next=${encodeURIComponent(here)}`;
    const loginHref = withNext(PATHS.login, here);
    return (
      <InviteCard orgName={invite.org_name} title="You're invited" description={`You were invited to join ${invite.org_name} as ${role}.`}>
        {meta}
        <Link to={invite.user_exists ? loginHref : signupHref} className={buttonClasses("primary", true)}>
          {invite.user_exists ? "Log in to join" : "Create account to join"}
        </Link>
        <Link to={invite.user_exists ? signupHref : loginHref} className={buttonClasses("secondary", true)}>
          {invite.user_exists ? "Create a new account" : "I already have an account"}
        </Link>
      </InviteCard>
    );
  }

  const myEmail = me.data?.email ?? "";
  if (myEmail.toLowerCase() !== invite.email.toLowerCase()) {
    return (
      <InviteCard orgName={invite.org_name} title="You're invited" description={`This invite is for ${invite.org_name}.`}>
        <Alert tone="warning">
          This invite was sent to {maskEmail(invite.email)}. You are signed in as another account.
        </Alert>
        <Button full loading={logout.isPending} onClick={() => {
            logout.mutate();
          }}>
          Log out and continue
        </Button>
        <Link to={PATHS.dashboard} className={buttonClasses("ghost", true)}>
          Back
        </Link>
      </InviteCard>
    );
  }

  return (
    <InviteCard orgName={invite.org_name} title={`Join ${invite.org_name}`} description={`You were invited to join as ${role}.`}>
      {meta}
      <div className="flex flex-col rounded-control bg-muted px-3 py-2 text-xs">
        <span className="text-secondary">Signed in as</span>
        <strong>{myEmail}</strong>
      </div>
      {accept.isError && <Alert>{getErrorMessage(accept.error)}</Alert>}
      <Button
        full
        loading={accept.isPending}
        onClick={() => {
          accept.mutate(token, {
            onSuccess: (result) => {
              toast("Workspace joined", `Welcome to ${result.org_name}.`);
              switchOrg(result.org_id);
            },
          });
        }}
      >
        Join {invite.org_name}
      </Button>
    </InviteCard>
  );
}
