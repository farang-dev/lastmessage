import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
// Only import cookies in server components
// import { cookies } from 'next/headers';

// Create a Supabase client for browser-side usage
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createClient(supabaseUrl, supabaseKey);
};

// Create a Supabase client for server-side usage
// This function should only be used in Server Components
export const createServerSupabaseClient = async () => {
  // Import cookies dynamically to avoid issues with client components
  const { cookies } = require('next/headers');
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookie = await cookieStore.get(name);
          return cookie?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
};