// server/db/create_missing_tables.js
const { pool } = require('../config/pgDb');

async function createMissingTables() {
  console.log('🔄 Connecting to PostgreSQL to create exams and doubts tables...');
  try {
    // 1. Create Exams Table
    console.log('⏳ Creating exams table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exams (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
        test_name VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        max_marks INTEGER NOT NULL,
        date DATE NOT NULL,
        scores JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create Doubts Table
    console.log('⏳ Creating doubts table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS doubts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        student_name VARCHAR(255) NOT NULL,
        question TEXT NOT NULL,
        ai_response TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Create Indexes
    console.log('⏳ Creating indexes...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_exams_business ON exams(business_id);
      CREATE INDEX IF NOT EXISTS idx_doubts_business ON doubts(business_id);
    `);

    console.log('✅ Exams and Doubts tables created successfully!');
  } catch (err) {
    console.error('❌ Error creating tables:', err.message);
    console.error(err);
  } finally {
    await pool.end();
    console.log('🔌 Connection pool closed.');
  }
}

createMissingTables();
