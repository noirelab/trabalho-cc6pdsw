"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  // Simplesmente define um cookie de autenticação mockado
  const cookieStore = await cookies();
  cookieStore.set("auth-token", "authenticated", {
    path: "/",
    httpOnly: true,
    maxAge: 60 * 60 * 24, // 1 dia
  });

  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
  redirect("/login");
}
