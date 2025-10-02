
class MemoryStore {
  constructor() {
    this.usuarios = new Map();
    this.gastos = new Map();
    this.init();
  }

 
  init() {
    console.log('💾 Inicializando almacenamiento en memoria...');
    console.log('📝 Datos de ejemplo cargados para pruebas');
  }

  
  async crearUsuario(usuario) {
    if (this.buscarUsuarioPorNombreUsuario(usuario.nombreUsuario)) {
      throw new Error('El nombre de usuario ya existe');
    }
    if (this.buscarUsuarioPorEmail(usuario.correoElectronico)) {
      throw new Error('El correo electrónico ya está registrado');
    }
    
    this.usuarios.set(usuario.id, usuario);
    return usuario;
  }

  async buscarUsuarioPorId(id) {
    return this.usuarios.get(id);
  }

  buscarUsuarioPorNombreUsuario(nombreUsuario) {
    for (const usuario of this.usuarios.values()) {
      if (usuario.nombreUsuario === nombreUsuario) {
        return usuario;
      }
    }
    return null;
  }

  buscarUsuarioPorEmail(email) {
    for (const usuario of this.usuarios.values()) {
      if (usuario.correoElectronico === email) {
        return usuario;
      }
    }
    return null;
  }
 
  async crearGasto(gasto) {
    this.gastos.set(gasto.id, gasto);
    return gasto;
  }

  async obtenerGastosPorUsuario(usuarioId) {
    const gastos = [];
    for (const gasto of this.gastos.values()) {
      if (gasto.usuarioId === usuarioId) {
        gastos.push(gasto);
      }
    }
 
    return gastos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }

  async buscarGastoPorId(id) {
    return this.gastos.get(id);
  }

  async actualizarGasto(id, datosActualizados) {
    const gasto = this.gastos.get(id);
    if (!gasto) {
      return null;
    }
    
    const gastoActualizado = { ...gasto, ...datosActualizados };
    this.gastos.set(id, gastoActualizado);
    return gastoActualizado;
  }

  async eliminarGasto(id) {
    return this.gastos.delete(id);
  }

  async obtenerResumenGastos(usuarioId) {
    const gastos = await this.obtenerGastosPorUsuario(usuarioId);
    
    const totalGastos = gastos.reduce((total, gasto) => total + gasto.monto, 0);
    const cantidadGastos = gastos.length;
    
    // Agrupar por categorías
    const gastosPorCategoria = {};
    const categoriasPredefinidas = [
      'Alimentación', 'Transporte', 'Entretenimiento', 'Compras',
      'Salud', 'Educación', 'Servicios', 'Otros'
    ];
    
    // Inicializar todas las categorías en 0
    categoriasPredefinidas.forEach(cat => {
      gastosPorCategoria[cat] = 0.00;
    });
    
    // Sumar gastos por categoría
    gastos.forEach(gasto => {
      if (gastosPorCategoria[gasto.categoria] !== undefined) {
        gastosPorCategoria[gasto.categoria] += gasto.monto;
      } else {
        gastosPorCategoria[gasto.categoria] = gasto.monto;
      }
    });
    
    // Obtener los 5 gastos más recientes
    const gastosRecientes = gastos.slice(0, 5);
    
    return {
      totalGastos: parseFloat(totalGastos.toFixed(2)),
      cantidadGastos,
      gastosPorCategoria,
      gastosRecientes
    };
  }

  // Método para obtener estadísticas
  getStats() {
    return {
      totalUsuarios: this.usuarios.size,
      totalGastos: this.gastos.size,
      storage: 'memoria (temporal)'
    };
  }

  // Método para limpiar datos (útil para tests)
  limpiar() {
    this.usuarios.clear();
    this.gastos.clear();
  }
}

// Crear instancia única (singleton)
const memoryStore = new MemoryStore();

module.exports = memoryStore;