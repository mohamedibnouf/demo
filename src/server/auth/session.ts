import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { SessionUser } from "@/types";
import { authSecret, demoPassword } from "@/lib/env";
import { getStore } from "@/server/data/store";

const COOKIE = "samco_session";

function secretKey() {
  return new TextEncoder().encode(authSecret());
}

export async function createSession(user: SessionUser): Promise<string> {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secretKey());
}

export async function readSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return (payload.user as SessionUser) ?? null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser) {
  const token = await createSession(user);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export function authenticate(email: string, password: string): SessionUser | null {
  if (password !== demoPassword()) return null;
  const store = getStore();
  const profile = store.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase() && p.active);
  if (!profile) return null;
  const role = store.roles.find((r) => r.id === profile.roleId);
  if (!role) return null;
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    role: role.name,
    roleId: role.id,
    departmentId: profile.departmentId,
    supplierId: profile.supplierId,
    customerId: profile.customerId,
    title: profile.title,
    locale: profile.locale,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await readSession();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}
