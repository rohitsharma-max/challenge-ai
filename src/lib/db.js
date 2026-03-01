// src/lib/db.js
import { Pool } from 'pg';

let pool;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return pool;
}

export async function query(text, params) {
  const pool = getPool();
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('executed query', { text: text.substring(0, 50), duration, rows: res.rowCount });
    }
    return res;
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  }
}

export async function getClient() {
  const pool = getPool();
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const release = client.release.bind(client);

  client.query = (...args) => originalQuery(...args);
  client.release = () => {
    client.query = originalQuery;
    client.release = release;
    return release();
  };

  return client;
}
