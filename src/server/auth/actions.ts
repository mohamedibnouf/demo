"use server";

import { redirect } from "next/navigation";
import { authenticate, clearSessionCookie, setSessionCookie } from "./session";
import { isDemoMode } from "@/lib/env";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const user = authenticate(email, password);
  if (!user) {
    redirect("/login?error=1");
  }
  await setSessionCookie(user);
  if (user.role === "Supplier") redirect("/quality/supplier-ncr");
  if (user.role === "Customer") redirect("/quality/customer-complaints");
  redirect("/");
}

export async function demoLoginAction(email: string) {
  if (!isDemoMode()) {
    throw new Error("Demo login is disabled");
  }
  const formData = new FormData();
  formData.set("email", email);
  formData.set("password", process.env.DEMO_PASSWORD ?? "SamcoDemo@2026");
  await loginAction(formData);
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
