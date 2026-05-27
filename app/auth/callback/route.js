/**
 * Route handler do callback de autenticação do Supabase.
 *
 * Usado pelo fluxo de recuperação de senha:
 *   1. Supabase envia email com link → /auth/callback?code=...&next=/login/redefinir-senha
 *   2. Este handler troca o code por uma sessão válida.
 *   3. Redireciona para a rota `next` (padrão: /dashboard/dppc).
 *
 * Em caso de erro redireciona para /login?erro=link-invalido.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard/dppc";

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?erro=link-invalido`);
}
