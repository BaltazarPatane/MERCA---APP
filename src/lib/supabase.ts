import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

// Solo la URL y la clave publicable. La seguridad de datos depende de RLS.
// No introducir jamás las claves del servidor ni el token del atajo.
export const supabase =
  url && publishableKey
    ? createClient(url, publishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;
