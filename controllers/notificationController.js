const admin = require('../config/firebase');
const connectDB = require('../config/db');

// Enviar notificación a todos los usuarios
exports.sendNotificationToAll = async (req, res) => {
  try {
    const { title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Título y mensaje son requeridos'
      });
    }

    const connection = await connectDB();
    
    // Obtener todos los push tokens
    const [users] = await connection.execute(
      'SELECT push_token FROM users WHERE push_token IS NOT NULL AND push_token != ""'
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No hay usuarios con tokens de notificación'
      });
    }

    const tokens = users.map(user => user.push_token);
    
    const message = {
      notification: {
        title,
        body
      },
      data: data || {},
      tokens
    };

    // Guardar notificación en BD
    const [result] = await connection.execute(
      'INSERT INTO notifications (title, body, data, sent_by, sent_to_all, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [title, body, JSON.stringify(data || {}), req.user.id, 1]
    );

    // Enviar notificación
    const response = await admin.messaging().sendMulticast(message);
    
    res.status(200).json({
      success: true,
      message: 'Notificación enviada correctamente',
      data: {
        notificationId: result.insertId,
        successCount: response.successCount,
        failureCount: response.failureCount
      }
    });

  } catch (error) {
    console.error('Error enviando notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar notificación',
      error: error.message
    });
  }
};

// Enviar notificación a usuario específico
exports.sendNotificationToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Título y mensaje son requeridos'
      });
    }

    const connection = await connectDB();
    
    // Obtener push token del usuario
    const [users] = await connection.execute(
      'SELECT push_token, username FROM users WHERE id = ? AND push_token IS NOT NULL',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado o sin token de notificación'
      });
    }

    const user = users[0];
    
    const message = {
      notification: {
        title,
        body
      },
      data: data || {},
      token: user.push_token
    };

    // Guardar notificación en BD
    const [result] = await connection.execute(
      'INSERT INTO notifications (title, body, data, sent_by, sent_to_user, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [title, body, JSON.stringify(data || {}), req.user.id, userId]
    );

    // Enviar notificación
    const response = await admin.messaging().send(message);
    
    res.status(200).json({
      success: true,
      message: `Notificación enviada a ${user.username}`,
      data: {
        notificationId: result.insertId,
        messageId: response
      }
    });

  } catch (error) {
    console.error('Error enviando notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar notificación',
      error: error.message
    });
  }
};

// Obtener historial de notificaciones
exports.getNotifications = async (req, res) => {
  try {
    const connection = await connectDB();
    
    const [notifications] = await connection.execute(`
      SELECT n.*, u1.username as sent_by_username, u2.username as sent_to_username
      FROM notifications n
      LEFT JOIN users u1 ON n.sent_by = u1.id
      LEFT JOIN users u2 ON n.sent_to_user = u2.id
      ORDER BY n.created_at DESC
      LIMIT 50
    `);

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });

  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones',
      error: error.message
    });
  }
};

// Marcar notificación como leída
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    const connection = await connectDB();
    
    await connection.execute(
      'INSERT INTO notification_reads (notification_id, user_id, read_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE read_at = NOW()',
      [notificationId, userId]
    );

    res.status(200).json({
      success: true,
      message: 'Notificación marcada como leída'
    });

  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar notificación',
      error: error.message
    });
  }
};