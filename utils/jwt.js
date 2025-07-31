const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_secreta_super_segura';

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId }, 
    JWT_SECRET, 
    { expiresIn: '30d' }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken
};