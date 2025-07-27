module.exports = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Acceso solo para administradores' });
};const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/auth');
const connectDB = require('../config/db');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const connection = await connectDB();
      const [users] = await connection.execute('SELECT id, username, role FROM users WHERE id = ?', [decoded.id]);
      if (!users.length) throw new Error('Usuario no encontrado');
      req.user = {
        id: users[0].id,
        username: users[0].username,
        role: users[0].role
      };
      return next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'No autorizado, token inválido o expirado' });
    }
  }
  return res.status(401).json({ success: false, message: 'No autorizado, no se proporcionó token' });
};

module.exports = { protect };