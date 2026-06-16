"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_URL = "http://localhost:3001";

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token");

  if (token) {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { Cookie: `auth-token=${token.value}` },
      });
    } catch {
      // Ignora erro da API, limpa cookie local mesmo assim
    }
  }

  cookieStore.delete("auth-token");
  redirect("/login");
}
