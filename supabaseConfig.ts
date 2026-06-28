// supabaseConfig.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hkdomdqfzwtfporivnek.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZG9tZHFmend0ZnBvcml2bmVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MzE2OTIsImV4cCI6MjA4NTMwNzY5Mn0.fjFzKzGnnxX6tVQEZviyPgnumlXX9ne71T89Y1nFhDo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);