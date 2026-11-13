// server/db/list_users.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/userModel');

async function listUsers() {
  console.log('🔄 Connecting to MongoDB to query users...');
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error('MONGO_URI environment variable is missing.');
    }
    await mongoose.connect(mongoURI);
    
    const users = await User.find({}).sort({ createdAt: -1 });
    console.log('\n📊 Users in your MongoDB database:');
    console.log('====================================');
    if (users.length === 0) {
      console.log('(No users found in database)');
    } else {
      users.forEach((user, i) => {
        console.log(`${i + 1}. Name: ${user.name} | Email: ${user.email} | Created At: ${user.createdAt}`);
      });
    }
    console.log('====================================\n');
  } catch (err) {
    console.error('Error fetching users:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

listUsers();
