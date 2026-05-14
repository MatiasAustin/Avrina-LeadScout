import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
// These will be provided by GitHub Actions secrets
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('--- Environment Check ---');
console.log('VITE_SUPABASE_URL defined:', !!process.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY defined:', !!process.env.VITE_SUPABASE_ANON_KEY);
console.log('SUPABASE_URL defined:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY defined:', !!process.env.SUPABASE_ANON_KEY);
console.log('------------------------');

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase credentials are required.');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your GitHub secrets.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function keepAlive() {
  console.log('Starting Supabase keep-alive ping...');
  try {
    // Attempt to query app_config
    console.log('Querying app_config table...');
    const { data, error } = await supabase
      .from('app_config')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Error querying app_config:', error.message);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      
      // Fallback: try a generic health check if table query fails
      console.log('Attempting fallback: querying leads table count...');
      const { count, error: countError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });
        
      if (countError) {
        console.error('Fallback also failed:', countError.message);
        process.exit(1);
      }
      console.log('Fallback successful. Lead count:', count);
    } else {
      console.log('Successfully pinged Supabase (app_config). Project is active.');
      console.log('Data returned:', data?.length ? 'Row found' : 'No rows');
    }
  } catch (err) {
    console.error('Unexpected error during keep-alive ping:', err);
    process.exit(1);
  }
}

keepAlive();
