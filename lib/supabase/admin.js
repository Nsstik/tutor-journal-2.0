import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// ВАЖНО: используйте этот клиент ТОЛЬКО в серверных файлах (server actions,
// route handlers). Никогда не импортируйте его в файлы с "use client".
// Он обходит все правила безопасности (RLS), поэтому service role key
// не должен попасть в браузер.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
