import { createClient } from '@supabase/supabase-js'

// SUBSTITUA PELOS DADOS QUE VOCÊ PEGOU NO PASSO 1 (EM PROJECT SETTINGS -> API)
const supabaseUrl = 'https://sxbzyxnzzzluibpudyda.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4Ynp5eG56enpsdWlicHVkeWRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODUyMzYsImV4cCI6MjA4NTQ2MTIzNn0.sKfXIyThKOIfzbJmGJHG1nqYYSFPMKltIBTDVHXvCnE'

export const supabase = createClient(supabaseUrl, supabaseKey)