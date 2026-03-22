import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseKey ? 'loaded' : 'EMPTY')

// Temporary reachability test
fetch('https://eoqgkbgslddtlvhunmsk.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvZ3FrYmdzbGRkdGx2aHVubXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMzcyMzQsImV4cCI6MjA4OTYxMzIzNH0.bH63tAMFLOXCJsgA5ccFzK2Kr87GbzPb9fXVIhS6T_0'
  }
})
  .then(r => console.log('Supabase reachability — Status:', r.status))
  .catch(e => console.log('Supabase reachability — Error:', e.message))

export const supabase = createClient(supabaseUrl, supabaseKey)
