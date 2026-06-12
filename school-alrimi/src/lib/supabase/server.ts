import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client with cookie-based auth.
 *
 * Use in Server Components, Route Handlers, and Server Actions.
 * Reads/writes auth cookies via Next.js `cookies()` so the session
 * is shared with the browser client.
 */
export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // `set` was called from a Server Component (read-only context).
            // Safe to ignore — middleware will refresh the session.
          }
        },
      },
    },
  );
}
