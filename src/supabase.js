import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ddsfrevymtdfwgpdsbrs.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkc2ZyZXZ5bXRkZndncGRzYnJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MTc3MjMsImV4cCI6MjEwMDE5MzcyM30.KaeXQhy-UwHZqgoFw6jnqgJmpvHpW0cn5sPnd07EDI8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)