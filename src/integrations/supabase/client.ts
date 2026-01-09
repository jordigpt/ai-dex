import { createClient } from '@supabase/supabase-js';

// Usamos las variables de entorno si existen, sino usamos las credenciales del proyecto actual
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://iqjbiacuwbqhtvubkovw.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxamJpYWN1d2JxaHR2dWJrb3Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MjQ5MDUsImV4cCI6MjA4MzQwMDkwNX0.gqg2-0PMHxLZa2POYqWnxISSOw_GQmvL_LpQmYB62es";

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);