import { createClient } from '@supabase/supabase-js';

// Create a service role client to bypass RLS
export const supabaseAdmin = createClient(
  "https://eakktmgnlwatvrgmjcok.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVha2t0bWdubHdhdHZyZ21qY29rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MjM0MzgxNCwiZXhwIjoyMDU3OTE5ODE0fQ.Ubl4ld0CR_XUoBWcWxtAmOTnkFm_7-cHjB9IjZPvK80"
); 