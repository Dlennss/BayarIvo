import { getAppServerSession } from "@/lib/server-auth";
import type { UserAppOrder, UserSession } from "@/components/user/types";
import { UserAuthClientSync } from "@/components/user/UserAuthClientSync";
import { BayarivoHomeConcept } from "@/components/bayarivo/BayarivoHomeConcept";
import { getUserProfile } from "@/lib/api.auth";
import { getUserOrders } from "@/lib/api.transactions";

type SessionShape = {
  user?: UserSession;
  backendToken?: string;
};

export default async function UserAppHomePage() {
  const session = (await getAppServerSession()) as SessionShape | null;
  const profile = session?.backendToken ? await getUserProfile(session.backendToken).catch(() => null) : null;
  const recentOrders = session?.backendToken
    ? (((await getUserOrders(session.backendToken, undefined, 3, 0).catch(() => [])) as UserAppOrder[]) || [])
    : [];

  return (
    <>
      {session?.backendToken ? <UserAuthClientSync backendToken={session.backendToken} /> : null}
      <BayarivoHomeConcept
        userMode
        isLoggedIn={!!session?.backendToken}
        displayName={profile?.nama || session?.user?.name || session?.user?.email || null}
        balance={profile ? Number(profile.saldo || 0) : null}
        recentOrders={recentOrders}
      />
    </>
  );
}
