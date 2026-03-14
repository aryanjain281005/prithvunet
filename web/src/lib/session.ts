import { jwtVerify, SignJWT } from "jose";
import type { AuthUser } from "@/lib/rbac";
import type { UserRole } from "@/lib/types";

export const SESSION_COOKIE_NAME = "pn_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

const secretValue = process.env.AUTH_JWT_SECRET || "dev-only-change-auth-jwt-secret";
const secret = new TextEncoder().encode(secretValue);

export interface SessionClaims {
  sub: string;
  name: string;
  email: string;
  role: UserRole;
  region?: string;
  avatar: string;
}

export async function signSession(user: AuthUser): Promise<string> {
  return new SignJWT({
    name: user.name,
    email: user.email,
    role: user.role,
    region: user.region,
    avatar: user.avatar,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret);

    if (
      typeof payload.sub !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string" ||
      typeof payload.avatar !== "string"
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role as UserRole,
      region: typeof payload.region === "string" ? payload.region : undefined,
      avatar: payload.avatar,
    };
  } catch {
    return null;
  }
}

export function cookieMaxAgeSeconds(): number {
  return SESSION_TTL_SECONDS;
}
