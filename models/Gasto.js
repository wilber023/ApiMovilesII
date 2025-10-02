const { v4: uuidv4 } = require('uuid');

class Gasto {
  constructor({ 
    id = null, 
    usuarioId, 
    monto, 
    categoria, 
    descripcion, 
    fecha = null, 
    fechaCreacion = null 
  }) {
    this.id = id || uuidv4();
    this.usuarioId = usuarioId;
    this.monto = parseFloat(monto);
    this.categoria = categoria;
    this.descripcion = descripcion;
    this.fecha = fecha || new Date();
    this.fechaCreacion = fechaCreacion || new Date();
  }

  validar() {
    const errores = [];
    
    if (!this.usuarioId) {
      errores.push('El ID del usuario es requerido');
    }
    
    if (!this.monto || this.monto <= 0) {
      errores.push('El monto debe ser mayor a 0');
    }
    
    if (!this.categoria || this.categoria.trim().length === 0) {
      errores.push('La categoría es requerida');
    }
    
    if (!this.descripcion || this.descripcion.trim().length === 0) {
      errores.push('La descripción es requerida');
    }
    
    return errores;
  }

  toJSON() {
    return {
      id: this.id,
      usuarioId: this.usuarioId,
      monto: this.monto,
      categoria: this.categoria,
      descripcion: this.descripcion,
      fecha: this.fecha,
      fechaCreacion: this.fechaCreacion
    };
  }
}

class ResumenGastos {
  constructor({ totalGastos = 0, cantidadGastos = 0, gastosPorCategoria = {}, gastosRecientes = [] }) {
    this.totalGastos = totalGastos;
    this.cantidadGastos = cantidadGastos;
    this.gastosPorCategoria = gastosPorCategoria;
    this.gastosRecientes = gastosRecientes;
  }
}

 
const CATEGORIAS_PREDEFINIDAS = [
  {
    id: "cat001",
    nombre: "Alimentación",
    icono: "restaurant",
    color: "orange"
  },
  {
    id: "cat002",
    nombre: "Transporte",
    icono: "directions_car",
    color: "blue"
  },
  {
    id: "cat003",
    nombre: "Entretenimiento",
    icono: "movie",
    color: "purple"
  },
  {
    id: "cat004",
    nombre: "Compras",
    icono: "shopping_bag",
    color: "pink"
  },
  {
    id: "cat005",
    nombre: "Salud",
    icono: "local_hospital",
    color: "red"
  },
  {
    id: "cat006",
    nombre: "Educación",
    icono: "school",
    color: "green"
  },
  {
    id: "cat007",
    nombre: "Servicios",
    icono: "build",
    color: "brown"
  },
  {
    id: "cat008",
    nombre: "Otros",
    icono: "attach_money",
    color: "deepPurple"
  }
];

module.exports = { Gasto, ResumenGastos, CATEGORIAS_PREDEFINIDAS };