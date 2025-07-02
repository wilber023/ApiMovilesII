  const jwt = require('jsonwebtoken');

  
  const JWT_SECRET = process.env.JWT_SECRET || 'expense_tracker_secret_key';
  
  const JWT_EXPIRE = process.env.JWT_EXPIRE || '30d';

  
  const generateToken = (userId) => {
    return jwt.sign({ id: userId }, JWT_SECRET, {
      expiresIn: JWT_EXPIRE
    });
  };

  module.exports = {
    JWT_SECRET,
    JWT_EXPIRE,
    generateToken
  };
