const jwt = require('jsonwebtoken');
const db = require('../config/pgDb');
const AppError = require('../utils/AppError');

const protect = async (req, res, next) => {
  try {
    let token;
    
    // 1. Check if token exists in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }
    
    // 2. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key-123');
    } catch (err) {
      return next(new AppError('Invalid or expired token. Please log in again.', 401));
    }
    
    // 3. Check if user still exists in PostgreSQL
    const userResult = await db.query(
      'SELECT id, business_id, name, email, role FROM users WHERE id = $1',
      [decoded.id]
    );
    const currentUser = userResult.rows[0];
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }
    
    // Map _id for backward compatibility with frontend
    currentUser._id = currentUser.id;
    
    // 4. Grant access to protected route
    req.user = currentUser;
    req.businessId = currentUser.business_id;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { protect };
