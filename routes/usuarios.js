const express = require('express');
const router = express.Router();
const { login, registro, obtenerUsuario } = require('../controllers/usuarioController');
 
router.post('/login', login);
  
router.post('/registro', registro);
 
router.get('/:id', obtenerUsuario);

module.exports = router;