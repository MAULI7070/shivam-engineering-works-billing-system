const { Client } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

async function run() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'billing_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  })
  await client.connect()
  const sql = fs.readFileSync(path.join(__dirname, 'migrations', '002_calculations.sql'), 'utf8')
  await client.query(sql)
  console.log('Migration 002 applied — calculations table created!')
  await client.end()
}

run().catch(e => { console.error(e.message); process.exit(1) })
