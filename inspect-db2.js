require('dotenv').config({ path: __dirname + '/.env' });
const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_DATABASE,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD
  });

  console.log('=== GLOBAL COUNTRIES ===');
  const [countries] = await pool.execute('SELECT * FROM global_countries');
  console.log(JSON.stringify(countries, null, 2));

  console.log('\n=== GLOBAL STATES (first 10) ===');
  const [states] = await pool.execute('SELECT state_id, country_id, name, web_slug, status FROM global_states WHERE status = 1 LIMIT 10');
  console.log(JSON.stringify(states, null, 2));

  console.log('\n=== GLOBAL CITIES with India check ===');
  const [indiaCheck] = await pool.execute("SELECT COUNT(*) as c FROM global_cities WHERE city LIKE '%Mumbai%' OR city LIKE '%Delhi%' OR city LIKE '%Bangalore%'");
  console.log('India cities found:', indiaCheck[0].c);

  console.log('\n=== OLD CITYS distinct categories ===');
  const [cats] = await pool.execute('SELECT DISTINCT category_name, COUNT(*) as cnt FROM citys GROUP BY category_name');
  console.log(JSON.stringify(cats, null, 2));

  console.log('\n=== OLD STATES with status count ===');
  const [statusCount] = await pool.execute('SELECT status, COUNT(*) as cnt FROM states GROUP BY status');
  console.log(JSON.stringify(statusCount, null, 2));
  
  console.log('\n=== OLD CITYS with status count ===');
  const [cityStatus] = await pool.execute('SELECT status, COUNT(*) as cnt FROM citys GROUP BY status');
  console.log(JSON.stringify(cityStatus, null, 2));

  await pool.end();
})();
