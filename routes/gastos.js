const express = require('express');
const router = express.Router();
const { 
  obtenerGastosPorUsuario,
  crearGasto,
  actualizarGasto,
  eliminarGasto,
  obtenerResumenGastos,
  obtenerCategorias
} = require('../controllers/gastoController');
 
router.get('/usuario/:usuarioId', obtenerGastosPorUsuario);

router.get('/usuario/:usuarioId/resumen', obtenerResumenGastos);

router.get('/categorias', obtenerCategorias);
 
router.post('/', crearGasto);

router.put('/:id', actualizarGasto);
 
router.delete('/:id', eliminarGasto);

module.exports = router;