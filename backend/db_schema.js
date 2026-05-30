const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres.cwaiqkgimqdjsznrizgt:Abhi_Adi_1999@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });

pool.query("SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'vendor_profiles'")
  .then(res => console.log(res.rows))
  .catch(console.error)
  .finally(() => pool.end());
