  const connectDB = require('../config/db');
  const moment = require('moment');
  const fs = require('fs');
  const cloudinary = require('cloudinary').v2;

  // Configuración de Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  // Función auxiliar para subir imagen a Cloudinary
  const uploadImageToCloudinary = async (file) => {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'expenses',
        resource_type: 'image'
      });

      // Eliminar archivo temporal
      fs.unlinkSync(file.path);

      return result.secure_url;
    } catch (error) {
      // Limpiar archivo temporal en caso de error
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw error;
    }
  };

  exports.getExpenses = async (req, res) => {
    try {
      const { category, search } = req.query;
      const userId = req.user.id;
      const connection = await connectDB();

  let query = `
    SELECT e.id, c.name AS category, e.description, e.amount, e.expense_date AS date, 
          e.image_url, e.latitude, e.longitude, e.address, e.created_at, e.updated_at
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE e.user_id = ?
  `;
      let params = [userId];

      if (category) {
        query += ' AND c.name = ?';
        params.push(category);
      }
      if (search) {
        query += ' AND e.description LIKE ?';
        params.push(`%${search}%`);
      }
      query += ' ORDER BY e.expense_date DESC';

      const [expenses] = await connection.execute(query, params);

      res.status(200).json({
        success: true,
        count: expenses.length,
        data: expenses
      });
    } catch (error) {
      console.error('Error al obtener gastos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener gastos',
        error: error.message
      });
    }
  };

  exports.getExpense = async (req, res) => {
    try {
      const userId = req.user.id;
      const expenseId = req.params.id;
      const connection = await connectDB();

      const [expenses] = await connection.execute(
        `SELECT e.id, c.name AS category, e.description, e.amount, e.expense_date AS date, 
                e.image_url, e.created_at, e.updated_at
        FROM expenses e
        JOIN categories c ON e.category_id = c.id
        WHERE e.id = ? AND e.user_id = ?`,
        [expenseId, userId]
      );

      if (expenses.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Gasto no encontrado'
        });
      }

      res.status(200).json({
        success: true,
        data: expenses[0]
      });
    } catch (error) {
      console.error('Error al obtener gasto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener gasto',
        error: error.message
      });
    }
  };

  exports.createExpense = async (req, res) => {
    try {
      const { category, description, amount, date, latitude, longitude, address } = req.body;

      const userId = req.user.id;

      if (!category || !description || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Por favor proporcione categoría, descripción y monto'
        });
      }

      const connection = await connectDB();

      // Buscar o crear categoría
      let [categories] = await connection.execute(
        'SELECT id FROM categories WHERE name = ? AND user_id = ?',
        [category, userId]
      );
      let categoryId;
      if (categories.length === 0) {
        const [result] = await connection.execute(
          'INSERT INTO categories (name, user_id) VALUES (?, ?)',
          [category, userId]
        );
        categoryId = result.insertId;
      } else {
        categoryId = categories[0].id;
      }

      const parseDate = (input) => {
        const parsed = moment(input, ['YYYY-MM-DD', 'YYYY/MM/DD', 'DD-MM-YYYY', 'D-M-YYYY'], true);
        return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null;
      };

      const expenseDate = parseDate(date) || new Date().toISOString().split('T')[0];

      // Subir imagen si existe
      let imageUrl = null;
      if (req.file) {
        try {
          imageUrl = await uploadImageToCloudinary(req.file);
        } catch (imageError) {
          console.error('Error al subir imagen:', imageError);
          // Continuar sin imagen en caso de error
        }
      }

      // Insertar gasto
  const [result] = await connection.execute(
    'INSERT INTO expenses (user_id, category_id, description, amount, expense_date, image_url, latitude, longitude, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [userId, categoryId, description, amount, expenseDate, imageUrl, 
    latitude ? parseFloat(latitude) : null, 
    longitude ? parseFloat(longitude) : null, 
    address || null]
  );

      // Obtener gasto creado
  const [expenses] = await connection.execute(
    `SELECT e.id, c.name AS category, e.description, e.amount, e.expense_date AS date, 
            e.image_url, e.latitude, e.longitude, e.address, e.created_at, e.updated_at
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE e.id = ?`,
    [result.insertId]
  );
      res.status(201).json({
        success: true,
        message: 'Gasto creado correctamente',
        data: expenses[0]
      });
    } catch (error) {
      console.error('Error al crear gasto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear gasto',
        error: error.message
      });
    }
  };

  exports.updateExpense = async (req, res) => {
    try {
      const userId = req.user.id;
      const expenseId = req.params.id;
      const { category, description, amount, date, latitude, longitude, address } = req.body;

      const connection = await connectDB();

      // Verificar que el gasto existe
      const [expenses] = await connection.execute(
        'SELECT * FROM expenses WHERE id = ? AND user_id = ?',
        [expenseId, userId]
      );
      if (expenses.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Gasto no encontrado o no autorizado'
        });
      }

      let categoryId = expenses[0].category_id;
      if (category) {
        let [categories] = await connection.execute(
          'SELECT id FROM categories WHERE name = ? AND user_id = ?',
          [category, userId]
        );
        if (categories.length === 0) {
          const [result] = await connection.execute(
            'INSERT INTO categories (name, user_id) VALUES (?, ?)',
            [category, userId]
          );
          categoryId = result.insertId;
        } else {
          categoryId = categories[0].id;
        }
      }

      function normalizeDate(input) {
        if (!input) return null;

        if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;

        if (/^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
          const [a, b, c] = input.split('/');
          const [day, month, year] = parseInt(a) > 12 ? [a, b, c] : [b, a, c];
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }

        const d = new Date(input);
        if (!isNaN(d)) {
          return d.toISOString().split('T')[0];
        }

        throw new Error(`Formato de fecha inválido: ${input}`);
      }

      const formattedDate = date ? normalizeDate(date) : expenses[0].expense_date;

      // Subir nueva imagen si existe
      let imageUrl = expenses[0].image_url; // Mantener imagen actual por defecto
      if (req.file) {
        try {
          imageUrl = await uploadImageToCloudinary(req.file);
        } catch (imageError) {
          console.error('Error al subir imagen:', imageError);
          // Mantener imagen actual en caso de error
        }
      }

      // Actualizar gasto
  await connection.execute(
    `UPDATE expenses SET category_id = ?, description = ?, amount = ?, expense_date = ?, image_url = ?, 
    latitude = ?, longitude = ?, address = ? 
    WHERE id = ? AND user_id = ?`,
    [
      categoryId,
      description || expenses[0].description,
      amount || expenses[0].amount,
      formattedDate,
      imageUrl,
      latitude !== undefined ? (latitude ? parseFloat(latitude) : null) : expenses[0].latitude,
      longitude !== undefined ? (longitude ? parseFloat(longitude) : null) : expenses[0].longitude,
      address !== undefined ? address : expenses[0].address,
      expenseId,
      userId
    ]
  );

  const [updatedExpenses] = await connection.execute(
    `SELECT e.id, c.name AS category, e.description, e.amount, e.expense_date AS date, 
            e.image_url, e.latitude, e.longitude, e.address, e.created_at, e.updated_at
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE e.id = ?`,
    [expenseId]
  );

      res.status(200).json({
        success: true,
        message: 'Gasto actualizado correctamente',
        data: updatedExpenses[0]
      });
    } catch (error) {
      console.error('Error al actualizar gasto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar gasto',
        error: error.message
      });
    }
  };

  exports.deleteExpense = async (req, res) => {
    try {
      const userId = req.user.id;
      const expenseId = req.params.id;
      const connection = await connectDB();

      // Verificar que el gasto existe
      const [expenses] = await connection.execute(
        'SELECT * FROM expenses WHERE id = ? AND user_id = ?',
        [expenseId, userId]
      );
      if (expenses.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Gasto no encontrado o no autorizado'
        });
      }

      // Eliminar gasto
      await connection.execute(
        'DELETE FROM expenses WHERE id = ? AND user_id = ?',
        [expenseId, userId]
      );

      res.status(200).json({
        success: true,
        message: 'Gasto eliminado correctamente',
        data: {}
      });
    } catch (error) {
      console.error('Error al eliminar gasto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar gasto',
        error: error.message
      });
    }
  };

  exports.getCategories = async (req, res) => {
    try {
      const userId = req.user.id;
      const connection = await connectDB();

      const [categories] = await connection.execute(
        'SELECT DISTINCT name FROM categories WHERE user_id = ?',
        [userId]
      );

      res.status(200).json({
        success: true,
        count: categories.length,
        data: categories.map(c => c.name)
      });
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener categorías',
        error: error.message
      });
    }
  };