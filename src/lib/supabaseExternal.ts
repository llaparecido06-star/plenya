import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const EXTERNAL_SUPABASE_URL = 'https://gdsdsjhicycunnbbjawi.supabase.co';
const EXTERNAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdkc2RzamhpY3ljdW5uYmJqYXdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NjMyMTQsImV4cCI6MjA4OTUzOTIxNH0.uZDB1-fXkdvoOZTc71g8J-oLOCQiguEeLDJoLQgX-D8';

export const supabase = createClient<Database>(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
