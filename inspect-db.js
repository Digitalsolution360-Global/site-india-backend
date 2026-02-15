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

  console.log('=== STATES TABLE ===');
  const [sc] = await pool.execute('DESCRIBE states');
  console.log(sc.map(r => r.Field + ' (' + r.Type + ')').join(', '));
  const [s] = await pool.execute('SELECT COUNT(*) as c FROM states');
  console.log('Count:', s[0].c);
  const [ss] = await pool.execute('SELECT * FROM states LIMIT 3');
  console.log(JSON.stringify(ss, null, 2));

  console.log('\n=== CITYS TABLE ===');
  const [cc] = await pool.execute('DESCRIBE citys');
  console.log(cc.map(r => r.Field + ' (' + r.Type + ')').join(', '));
  const [c2] = await pool.execute('SELECT COUNT(*) as c FROM citys');
  console.log('Count:', c2[0].c);
  const [cs] = await pool.execute('SELECT * FROM citys LIMIT 3');
  console.log(JSON.stringify(cs, null, 2));

  console.log('\n=== GLOBAL_STATES TABLE ===');
  const [gs] = await pool.execute('DESCRIBE global_states');
  console.log(gs.map(r => r.Field + ' (' + r.Type + ')').join(', '));
  const [g1] = await pool.execute('SELECT COUNT(*) as c FROM global_states');
  console.log('Count:', g1[0].c);
  const [gss] = await pool.execute('SELECT * FROM global_states LIMIT 3');
  console.log(JSON.stringify(gss, null, 2));

  console.log('\n=== GLOBAL_CITIES TABLE ===');
  const [gc] = await pool.execute('DESCRIBE global_cities');
  console.log(gc.map(r => r.Field + ' (' + r.Type + ')').join(', '));
  const [g2] = await pool.execute('SELECT COUNT(*) as c FROM global_cities');
  console.log('Count:', g2[0].c);
  const [gcs] = await pool.execute('SELECT * FROM global_cities LIMIT 3');
  console.log(JSON.stringify(gcs, null, 2));

  await pool.end();
})();
