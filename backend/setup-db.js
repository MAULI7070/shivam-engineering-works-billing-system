// setup-db.js — Creates billing_db and runs migration
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setup() {
  // Step 1: Connect to default 'postgres' DB to create billing_db
  const adminClient = new Client({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432'),
    database: 'postgres',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || '',
  });

  await adminClient.connect();
  console.log('Connected to postgres...');

  // Check if billing_db exists
  const check = await adminClient.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [process.env.DB_NAME || 'billing_db']
  );

  if (check.rows.length === 0) {
    await adminClient.query(`CREATE DATABASE ${process.env.DB_NAME || 'billing_db'}`);
    console.log('Created database: ' + (process.env.DB_NAME || 'billing_db'));
  } else {
    console.log('Database already exists.');
  }
  await adminClient.end();

  // Step 2: Connect to billing_db and run migration
  const appClient = new Client({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME     || 'billing_db',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || '',
  });

  await appClient.connect();
  console.log('Connected to billing_db...');

  const sql = fs.readFileSync(
    path.join(__dirname, 'migrations', '001_create_tables.sql'),
    'utf8'
  );
  await appClient.query(sql);
  console.log('Migration applied — tables created and seed data inserted!');
  await appClient.end();

  console.log('\n✅ Database setup complete! You can now start the server with: node server.js');
}

setup().catch(err => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
