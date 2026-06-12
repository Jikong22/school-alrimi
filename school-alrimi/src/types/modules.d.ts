// Ambient module declarations for packages that ship without their own types.
// @supabase/ssr v0.6.x publishes .js only — we type the surface we use.

declare module "@supabase/ssr" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type AnyRecord = Record<string, any>;

  interface CookieMethodsServer {
    getAll(): { name: string; value: string }[];
    setAll(cookiesToSet: {
      name: string;
      value: string;
      options?: { [key: string]: unknown };
    }[]): void;
  }

  interface CookieMethodsBrowser {
    getAll(): { name: string; value: string }[];
    setAll(cookiesToSet: {
      name: string;
      value: string;
      options?: { [key: string]: unknown };
    }[]): void;
  }

  export function createBrowserClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: { cookies?: CookieMethodsBrowser; cookieOptions?: AnyRecord },
  ): import("@supabase/supabase-js").SupabaseClient;

  export function createServerClient(
    supabaseUrl: string,
    supabaseKey: string,
    options: { cookies: CookieMethodsServer; cookieOptions?: AnyRecord },
  ): import("@supabase/supabase-js").SupabaseClient;
}
