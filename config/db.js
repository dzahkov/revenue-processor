const { Pool } = require('pg');

const pool = new Pool({
    user: 'davidzahkov',
    host: 'localhost',
    database: 'event_processor',
    password: '',
    port: 5432,
});

pool.query(`
  SELECT to_regclass('public.users_revenue');
`)
  .then(result => {
    if (!result.rows[0].to_regclass) {
      return pool.query(`
        CREATE TABLE users_revenue (
          user_id  VARCHAR PRIMARY KEY,
          revenue INTEGER
        );
      `);
    }
  })
  .then(() => console.log('Table created'))
  .catch(err => console.error(err.stack));

module.exports = pool;