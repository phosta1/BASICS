import { createClient } from "@supabase/supabase-js";

// Replace these with your actual Supabase project values
// Found at: https://app.supabase.com → Project → Settings → API
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://your-project.supabase.co";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "your-anon-key";

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
