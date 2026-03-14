import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySession, type SessionClaims } from "@/lib/session";

export async function getRequestSession(): Promise<SessionClaims | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySession(token);
}
