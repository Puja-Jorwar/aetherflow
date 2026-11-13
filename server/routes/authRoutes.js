const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/pgDb');
const AppError = require('../utils/AppError');
const { successResponse } = require('../utils/apiResponse');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback-secret-key-123', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);
  
  // Create backward compatibility _id field for React client
  const userPayload = {
    _id: user.id,
    id: user.id,
    business_id: user.business_id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  
  return successResponse(res, 'Authentication successful', { user: userPayload, token }, statusCode);
};

// REGISTER USER & AUTO-CREATE DEFAULT TENANT BUSINESS
router.post('/register', async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return next(new AppError('Please provide name, email, and password', 400));
    }
    
    await client.query('BEGIN');
    
    // 1. Check if user already exists
    const existingResult = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existingResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return next(new AppError('Email already in use. Please use a different one.', 400));
    }
    
    // 2. Create default business tenant profile
    const cleanedEmail = email.toLowerCase().replace(/[^a-z0-9]/g, '');
    const uniqueSuffix = Math.random().toString(36).substring(2, 7);
    const defaultSubdomain = `${cleanedEmail.substring(0, 15)}-${uniqueSuffix}`;
    const defaultBusinessName = `${name}'s Institute`;

    const businessResult = await client.query(
      'INSERT INTO businesses (name, subdomain) VALUES ($1, $2) RETURNING id',
      [defaultBusinessName, defaultSubdomain]
    );
    const businessId = businessResult.rows[0].id;
    
    // 3. Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // 4. Create user linked to business as Owner
    const userResult = await client.query(
      'INSERT INTO users (business_id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, business_id, name, email, role',
      [businessId, name, email.toLowerCase().trim(), passwordHash, 'Owner']
    );
    const newUser = userResult.rows[0];
    
    await client.query('COMMIT');
    
    createSendToken(newUser, 201, res);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// LOGIN
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // 1) Check if email and password exist
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }
    
    // 2) Check if user exists in PostgreSQL
    const userResult = await db.query(
      'SELECT id, business_id, name, email, password_hash, role FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    const user = userResult.rows[0];
    
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return next(new AppError('Incorrect email or password', 401));
    }
    
    // 3) If everything ok, send token to client
    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
});

// ME (Get Profile)
router.get('/me', protect, (req, res) => {
  // Map _id for backward compatibility
  const userPayload = {
    ...req.user,
    _id: req.user.id
  };
  return successResponse(res, 'User profile fetched successfully', { user: userPayload });
});

module.exports = router;
