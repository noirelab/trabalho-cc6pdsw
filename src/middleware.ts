import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token");

  // Se o usuário tentar acessar rotas que começam com /dashboard
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    // Se não tiver o token, redireciona para a página de login
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/dashboard"],
};
