const pool = require('./config/db');
pool.query("SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'orders'", (err, res) => {
  if (err) console.error(err);
  else console.log(JSON.stringify(res.rows, null, 2));
  process.exit();
});
