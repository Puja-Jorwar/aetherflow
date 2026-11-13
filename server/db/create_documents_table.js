// server/db/create_documents_table.js
const { pool } = require('../config/pgDb');

async function createDocumentsTable() {
  console.log('🔄 Connecting to PostgreSQL to create documents table...');
  try {
    console.log('⏳ Creating documents table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        size_bytes INTEGER,
        chunks JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('⏳ Creating index...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
    `);

    console.log('✅ Documents table created successfully!');
  } catch (err) {
    console.error('❌ Error creating documents table:', err.message);
    console.error(err);
  } finally {
    await pool.end();
    console.log('🔌 Connection pool closed.');
  }
}

createDocumentsTable();
