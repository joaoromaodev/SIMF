/**
 * Middleware de autenticação do SIMF.
 *
 * Responsabilidades:
 *  1. Atualizar o token de sessão do Supabase em cada request.
 *  2. Redirecionar usuários não autenticados para /login ao acessar /dashboard.
 *  3. Redirecionar usuários já autenticados para /dashboard/dppc ao acessar /login.
 *
 * Nota: verificação de ROLE (admin/user) ocorre nas páginas e na API,
 * não aqui, para manter o middleware leve.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Atualiza sessão — obrigatório para manter tokens frescos
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Rotas protegidas — exigem autenticação
  if (!user && pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Usuário já autenticado tentando acessar /login — redireciona para dashboard
  // (permite /login/recuperar-senha e /login/redefinir-senha mesmo autenticado)
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard/dppc", request.url));
  }

  return response;
}

export const config = {
  // /dashboard → protegido
  // /login e subpáginas → gerenciado (recuperar-senha, redefinir-senha)
  // /auth → callback de recuperação de senha
  matcher: ["/dashboard/:path*", "/login", "/login/:path*", "/auth/:path*"],
};
