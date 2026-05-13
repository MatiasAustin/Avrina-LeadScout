import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
// These will be provided by GitHub Actions secrets
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase credentials are required.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function keepAlive() {
  console.log('Starting Supabase keep-alive ping...');
  try {
    // Perform a simple read operation to prevent project from pausing
    // app_config table is used because it's lightweight and accessible
    const { data, error } = await supabase
      .from('app_config')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Error pinging Supabase:', error.message);
      process.exit(1);
    }

    console.log('Successfully pinged Supabase. Project is active.');
    console.log('Response:', data);
  } catch (err) {
    console.error('Unexpected error during keep-alive ping:', err);
    process.exit(1);
  }
}

keepAlive();
