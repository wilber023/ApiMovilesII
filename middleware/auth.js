  const jwt = require('jsonwebtoken');
  const { JWT_SECRET } = require('../config/auth');

  const protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);

  
        req.user = {
          id: decoded.id,
          username: decoded.username  
        };

        return next();
      } catch (error) {
        console.error('Error en middleware de autenticación:', error);
        return res.status(401).json({
          success: false,
          message: 'No autorizado, token inválido o expirado'
        });
      }
    }

    return res.status(401).json({
      success: false,
      message: 'No autorizado, no se proporcionó token'
    });
  };

  module.exports = { protect };