const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class Usuario {
  constructor({ id = null, nombre, nombreUsuario, correoElectronico, contrasena, fechaRegistro = null, estaActivo = true }) {
    this.id = id || uuidv4();
    this.nombre = nombre;
    this.nombreUsuario = nombreUsuario;
    this.correoElectronico = correoElectronico;
    this.contrasena = contrasena;
    this.fechaRegistro = fechaRegistro || new Date();
    this.estaActivo = estaActivo;
  }
 
  async hashContrasena() {
    if (this.contrasena) {
      this.contrasena = await bcrypt.hash(this.contrasena, 10);
    }
  }
 
  async compararContrasena(contrasenaIngresada) {
    return await bcrypt.compare(contrasenaIngresada, this.contrasena);
  }

 
  toJSON() {
    const { contrasena, ...usuarioSinContrasena } = this;
    return usuarioSinContrasena;
  }

 
  validar() {
    const errores = [];
    
    if (!this.nombre || this.nombre.trim().length < 2) {
      errores.push('El nombre debe tener al menos 2 caracteres');
    }
    
    if (!this.nombreUsuario || this.nombreUsuario.trim().length < 3) {
      errores.push('El nombre de usuario debe tener al menos 3 caracteres');
    }
    
    if (!this.correoElectronico || !/\S+@\S+\.\S+/.test(this.correoElectronico)) {
      errores.push('El correo electrónico debe tener un formato válido');
    }
    
    if (!this.contrasena || this.contrasena.length < 6) {
      errores.push('La contraseña debe tener al menos 6 caracteres');
    }
    
    return errores;
  }
}

module.exports = Usuario;
