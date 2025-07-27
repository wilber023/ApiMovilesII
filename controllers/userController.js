const connectDB = require('../config/db');

// Listar todos los usuarios (solo admin)
exports.getAllUsers = async (req, res) => {
  try {
    const connection = await connectDB();
    const [users] = await connection.execute('SELECT id, username, role, push_token, created_at FROM users');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener usuarios', error: error.message });
  }
};

// Eliminar usuario (solo admin)
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const connection = await connectDB();
    await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
    res.status(200).json({ success: true, message: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar usuario', error: error.message });
  }
};

// Guardar/actualizar push token de usuario
exports.savePushToken = async (req, res) => {
  try {
    const { push_token } = req.body;
    const userId = req.user.id;
    const connection = await connectDB();
    await connection.execute('UPDATE users SET push_token = ? WHERE id = ?', [push_token, userId]);
    res.status(200).json({ success: true, message: 'Push token guardado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al guardar push token', error: error.message });
  }
};