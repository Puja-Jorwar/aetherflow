// server/db/create_ai_tables.js
const { pool } = require('../config/pgDb');

async function createAiTables() {
  console.log('🔄 Connecting to PostgreSQL to create prompts and chats tables...');
  try {
    // 1. Create Prompts Table
    console.log('⏳ Creating prompts table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS prompts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        prompt_text TEXT NOT NULL,
        category VARCHAR(100) DEFAULT 'General' CHECK (category IN ('General', 'Marketing', 'Development', 'Productivity', 'Writing')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create Chats Table
    console.log('⏳ Creating chats table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chats (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL DEFAULT 'New Chat',
        messages JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Create Indexes for fast querying
    console.log('⏳ Creating indexes...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_prompts_user ON prompts(user_id);
      CREATE INDEX IF NOT EXISTS idx_chats_user ON chats(user_id);
    `);

    console.log('✅ Prompts and Chats tables created successfully!');
  } catch (err) {
    console.error('❌ Error creating tables:', err.message);
    console.error(err);
  } finally {
    await pool.end();
    console.log('🔌 Connection pool closed.');
  }
}

createAiTables();
