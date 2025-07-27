const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser, savePushToken } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.get('/', protect, isAdmin, getAllUsers);         // Listar usuarios (solo admin)
router.delete('/:id', protect, isAdmin, deleteUser);    // Eliminar usuario (solo admin)
router.post('/push-token', protect, savePushToken);     // Guardar push token (usuario normal)

module.exports = router;