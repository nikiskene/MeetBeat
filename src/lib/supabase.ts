// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iwvdnvryzyvvstahqqqu.supabase.co';
const supabaseAnonKey = 'sb_publishable_ymqdz5WIfbys-dv52OxjBA_YZXWTDqL';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
