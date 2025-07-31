const connectDB = require('../config/db');

// Listar todos los usuarios (solo admin)
exports.getAllUsers = async (req, res) => {
  try {
    const connection = await connectDB();
    const [users] = await connection.execute('SELECT id, username, role, push_token, created_at FROM users ORDER BY created_at DESC');
    res.status(200).json({ 
      success: true, 
      count: users.length, 
      data: users 
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener usuarios', 
      error: error.message 
    });
  }
};

// Eliminar usuario (solo admin)
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Evitar que un admin se elimine a sí mismo
    if (userId == req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propia cuenta'
      });
    }

    const connection = await connectDB();
    const [result] = await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Usuario eliminado correctamente' 
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar usuario', 
      error: error.message 
    });
  }
};

// Guardar/actualizar push token de usuario
exports.savePushToken = async (req, res) => {
  try {
    const { push_token } = req.body;
    const userId = req.user.id;

    if (!push_token) {
      return res.status(400).json({
        success: false,
        message: 'Push token es requerido'
      });
    }

    const connection = await connectDB();
    await connection.execute('UPDATE users SET push_token = ? WHERE id = ?', [push_token, userId]);
    
    res.status(200).json({ 
      success: true, 
      message: 'Push token guardado correctamente' 
    });
  } catch (error) {
    console.error('Error guardando push token:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al guardar push token', 
      error: error.message 
    });
  }
};