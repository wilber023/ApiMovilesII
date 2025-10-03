const express = require('express');
const router = express.Router();
const { login, registro, obtenerUsuario, obtenerTodosLosUsuarios } = require('../controllers/usuarioController');

// Obtener todos los usuarios (debe ir antes de /:id para evitar conflictos)
router.get('/', obtenerTodosLosUsuarios);
 
router.post('/login', login);
  
router.post('/registro', registro);
 
router.get('/:id', obtenerUsuario);

module.exports = router;