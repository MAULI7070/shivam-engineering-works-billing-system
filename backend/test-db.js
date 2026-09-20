const db = require('./db');
db.query('SELECT 1')
  .then(() => { console.log('DB_OK'); process.exit(0); })
  .catch(e => { console.error('DB_ERROR:' + e.message); process.exit(1); });
