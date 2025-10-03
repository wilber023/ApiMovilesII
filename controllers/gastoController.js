const connectDB = require('../config/db');
const { Gasto, ResumenGastos, CATEGORIAS_PREDEFINIDAS } = require('../models/Gasto');

 
exports.obtenerGastosPorUsuario = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const connection = await connectDB();
    const [gastos] = await connection.execute(
      `SELECT id, usuario_id as usuarioId, monto, categoria, descripcion, fecha, fecha_creacion as fechaCreacion
       FROM gastos WHERE usuario_id = ? ORDER BY fecha DESC`,
      [usuarioId]
    );

    const gastosFormateados = gastos.map(gasto => ({
      id: gasto.id,
      usuarioId: gasto.usuarioId,
      monto: parseFloat(gasto.monto),
      categoria: gasto.categoria,
      descripcion: gasto.descripcion,
      fecha: gasto.fecha,
      fechaCreacion: gasto.fechaCreacion
    }));

    await connection.end();
    res.status(200).json(gastosFormateados);

  } catch (error) {
    console.error('Error al obtener gastos:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor'
    });
  }
};

 
exports.crearGasto = async (req, res) => {
  try {
    console.log('📝 Datos recibidos para crear gasto:', req.body);
    
    const { usuarioId, monto, categoria, descripcion, fecha } = req.body;

    const nuevoGasto = new Gasto({
      usuarioId,
      monto,
      categoria,
      descripcion,
      fecha: fecha ? new Date(fecha) : new Date()
    });

    console.log('💰 Gasto creado en memoria:', nuevoGasto.toJSON());

    // Validar los datos del gasto
    const erroresValidacion = nuevoGasto.validar();
    if (erroresValidacion.length > 0) {
      console.log('❌ Errores de validación:', erroresValidacion);
      return res.status(400).json({
        mensaje: erroresValidacion.join(', ')
      });
    }

    console.log('✅ Validación pasada, conectando a BD...');
    const connection = await connectDB();

    // Verificar que el usuario existe
    console.log('🔍 Verificando usuario con ID:', usuarioId);
    const [usuarios] = await connection.execute(
      'SELECT id FROM usuarios WHERE id = ?',
      [usuarioId]
    );

    if (usuarios.length === 0) {
      console.log('❌ Usuario no encontrado en BD');
      await connection.end();
      return res.status(400).json({
        mensaje: 'Usuario no encontrado'
      });
    }

    console.log('✅ Usuario encontrado, insertando gasto...');

    // Insertar el gasto en la base de datos
    const result = await connection.execute(
      `INSERT INTO gastos (id, usuario_id, monto, categoria, descripcion, fecha, fecha_creacion)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nuevoGasto.id,
        nuevoGasto.usuarioId,
        nuevoGasto.monto,
        nuevoGasto.categoria,
        nuevoGasto.descripcion,
        nuevoGasto.fecha,
        nuevoGasto.fechaCreacion
      ]
    );

    console.log('✅ Gasto insertado exitosamente. Resultado:', result[0]);
    await connection.end();
    
    console.log('📤 Enviando respuesta:', nuevoGasto.toJSON());
    res.status(201).json(nuevoGasto.toJSON());

  } catch (error) {
    console.error('💥 Error completo al crear gasto:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      mensaje: 'Error interno del servidor',
      detalleError: error.message
    });
  }
};

 
exports.actualizarGasto = async (req, res) => {
  try {
    const { id } = req.params;
    const { monto, categoria, descripcion, fecha } = req.body;

    
    const connection = await connectDB();

    
    const [gastos] = await connection.execute(
      'SELECT * FROM gastos WHERE id = ?',
      [id]
    );

    if (gastos.length === 0) {
      await connection.end();
      return res.status(404).json({
        mensaje: 'Gasto no encontrado',
        gastoId: id
      });
    }

    const gastoExistente = gastos[0];

 
    const gastoParaValidar = new Gasto({
      id: gastoExistente.id,
      usuarioId: gastoExistente.usuario_id,
      monto: monto !== undefined ? monto : gastoExistente.monto,
      categoria: categoria !== undefined ? categoria : gastoExistente.categoria,
      descripcion: descripcion !== undefined ? descripcion : gastoExistente.descripcion,
      fecha: fecha !== undefined ? new Date(fecha) : gastoExistente.fecha,
      fechaCreacion: gastoExistente.fecha_creacion
    });

  
    const erroresValidacion = gastoParaValidar.validar();
    if (erroresValidacion.length > 0) {
      await connection.end();
      return res.status(400).json({
        mensaje: erroresValidacion.join(', ')
      });
    }

 
    await connection.execute(
      `UPDATE gastos SET monto = ?, categoria = ?, descripcion = ?, fecha = ? WHERE id = ?`,
      [
        gastoParaValidar.monto,
        gastoParaValidar.categoria,
        gastoParaValidar.descripcion,
        gastoParaValidar.fecha,
        id
      ]
    );

    await connection.end();

    res.status(200).json(gastoParaValidar.toJSON());

  } catch (error) {
    console.error('Error al actualizar gasto:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor'
    });
  }
};

 
exports.eliminarGasto = async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await connectDB();

 
    const [gastos] = await connection.execute(
      'SELECT id FROM gastos WHERE id = ?',
      [id]
    );

    if (gastos.length === 0) {
      await connection.end();
      return res.status(404).json({
        mensaje: 'Gasto no encontrado',
        gastoId: id
      });
    }

  
    await connection.execute('DELETE FROM gastos WHERE id = ?', [id]);
    await connection.end();

    res.status(200).json({
      mensaje: 'Gasto eliminado exitosamente',
      gastoId: id
    });

  } catch (error) {
    console.error('Error al eliminar gasto:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor'
    });
  }
};

 
exports.obtenerResumenGastos = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const connection = await connectDB();

    
    const [totales] = await connection.execute(
      `SELECT COUNT(*) as cantidadGastos, COALESCE(SUM(monto), 0) as totalGastos
       FROM gastos WHERE usuario_id = ?`,
      [usuarioId]
    );
 
    const [gastosPorCategoria] = await connection.execute(
      `SELECT categoria, COALESCE(SUM(monto), 0) as total
       FROM gastos WHERE usuario_id = ? GROUP BY categoria`,
      [usuarioId]
    );

   
    const [gastosRecientes] = await connection.execute(
      `SELECT id, usuario_id as usuarioId, monto, categoria, descripcion, fecha, fecha_creacion as fechaCreacion
       FROM gastos WHERE usuario_id = ? ORDER BY fecha_creacion DESC LIMIT 5`,
      [usuarioId]
    );
 
    const gastosPorCategoriaObj = {};
    CATEGORIAS_PREDEFINIDAS.forEach(cat => {
      gastosPorCategoriaObj[cat.nombre] = 0.00;
    });

   
    gastosPorCategoria.forEach(item => {
      gastosPorCategoriaObj[item.categoria] = parseFloat(item.total);
    });
 
    const gastosRecientesFormateados = gastosRecientes.map(gasto => ({
      id: gasto.id,
      usuarioId: gasto.usuarioId,
      monto: parseFloat(gasto.monto),
      categoria: gasto.categoria,
      descripcion: gasto.descripcion,
      fecha: gasto.fecha,
      fechaCreacion: gasto.fechaCreacion
    }));

    const resumen = new ResumenGastos({
      totalGastos: parseFloat(totales[0].totalGastos),
      cantidadGastos: parseInt(totales[0].cantidadGastos),
      gastosPorCategoria: gastosPorCategoriaObj,
      gastosRecientes: gastosRecientesFormateados
    });

    await connection.end();
    res.status(200).json(resumen);

  } catch (error) {
    console.error('Error al obtener resumen de gastos:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor'
    });
  }
};

 
exports.obtenerCategorias = async (req, res) => {
  try {
    res.status(200).json(CATEGORIAS_PREDEFINIDAS);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor'
    });
  }
};