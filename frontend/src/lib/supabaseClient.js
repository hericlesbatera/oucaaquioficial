import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rtdxqthhhwqnlrevzmap.supabase.co';
export const SUPABASE_URL = supabaseUrl;
export { supabaseAnonKey as SUPABASE_ANON_KEY };
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0ZHhxdGhoaHdxbmxyZXZ6bWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5ODI4MjYsImV4cCI6MjA4MDU1ODgyNn0.njhKNQVbMWn-MlAhWfnHOVIRh988xksKry8ofEtEnOw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
