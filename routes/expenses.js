const express = require('express');
const multer = require('multer');
const router = express.Router();
const { 
  getExpenses, 
  getExpense, 
  createExpense, 
  updateExpense, 
  deleteExpense,
  getCategories 
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');

// Configuración de multer para manejo de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'temp/'); // Asegúrate de que esta carpeta exista
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  // Permitir solo imágenes
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

// Rutas principales
router.route('/')
  .get(getExpenses)
  .post(upload.single('image'), createExpense); // Permitir imagen en creación

router.route('/:id')
  .get(getExpense)
  .put(upload.single('image'), updateExpense) // Permitir imagen en actualización
  .delete(deleteExpense);

// Ruta para obtener categorías
router.get('/categories', getCategories);

module.exports = router;