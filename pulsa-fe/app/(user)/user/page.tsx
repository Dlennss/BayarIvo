import { getAppServerSession } from "@/lib/server-auth";
import type { UserSession } from "@/components/user/types";
import { UserAuthClientSync } from "@/components/user/UserAuthClientSync";
import { BayarivoHomeConcept } from "@/components/bayarivo/BayarivoHomeConcept";

type SessionShape = {
  user?: UserSession;
  backendToken?: string;
};

export default async function UserAppHomePage() {
  const session = (await getAppServerSession()) as SessionShape | null;

  return (
    <>
      {session?.backendToken ? <UserAuthClientSync backendToken={session.backendToken} /> : null}
      <BayarivoHomeConcept userMode isLoggedIn={!!session?.backendToken} />
    </>
  );
}
