const connectDB = require('../config/db');
const Usuario = require('../models/User');
 
class ResultadoInicioSesion {
  constructor(esExitoso, usuario = null, mensajeError = null) {
    this.esExitoso = esExitoso;
    this.usuario = usuario;
    this.mensajeError = mensajeError;
  }
}
 
exports.login = async (req, res) => {
  try {
    const { nombreUsuario, contrasena } = req.body;

    if (!nombreUsuario || !contrasena) {
      return res.status(400).json(
        new ResultadoInicioSesion(false, null, 'Nombre de usuario y contraseña son requeridos')
      );
    }

    const connection = await connectDB();
    const [usuarios] = await connection.execute(
      'SELECT * FROM usuarios WHERE nombre_usuario = ?',
      [nombreUsuario]
    );

    if (usuarios.length === 0) {
      await connection.end();
      return res.status(400).json(
        new ResultadoInicioSesion(false, null, 'Credenciales inválidas')
      );
    }

    const datosUsuario = usuarios[0];
    const usuario = new Usuario({
      id: datosUsuario.id,
      nombre: datosUsuario.nombre,
      nombreUsuario: datosUsuario.nombre_usuario,
      correoElectronico: datosUsuario.correo_electronico,
      contrasena: datosUsuario.contrasena,
      fechaRegistro: datosUsuario.fecha_registro,
      estaActivo: datosUsuario.esta_activo
    });

    const contrasenaValida = await usuario.compararContrasena(contrasena);
    if (!contrasenaValida) {
      await connection.end();
      return res.status(400).json(
        new ResultadoInicioSesion(false, null, 'Credenciales inválidas')
      );
    }

    await connection.end();
    res.status(200).json(
      new ResultadoInicioSesion(true, usuario.toJSON(), null)
    );

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json(
      new ResultadoInicioSesion(false, null, 'Error interno del servidor')
    );
  }
};
 
exports.registro = async (req, res) => {
  try {
    const { nombre, nombreUsuario, correoElectronico, contrasena } = req.body;

    const nuevoUsuario = new Usuario({
      nombre,
      nombreUsuario,
      correoElectronico,
      contrasena
    });
 
    const erroresValidacion = nuevoUsuario.validar();
    if (erroresValidacion.length > 0) {
      return res.status(400).json(
        new ResultadoInicioSesion(false, null, erroresValidacion.join(', '))
      );
    }

    const connection = await connectDB();

 
    const [usuariosExistentes] = await connection.execute(
      'SELECT id FROM usuarios WHERE nombre_usuario = ? OR correo_electronico = ?',
      [nombreUsuario, correoElectronico]
    );

    if (usuariosExistentes.length > 0) {
      await connection.end();
      return res.status(400).json(
        new ResultadoInicioSesion(false, null, 'El nombre de usuario o correo electrónico ya existe')
      );
    }

 
    await nuevoUsuario.hashContrasena();

 
    await connection.execute(
      `INSERT INTO usuarios (id, nombre, nombre_usuario, correo_electronico, contrasena, fecha_registro, esta_activo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nuevoUsuario.id,
        nuevoUsuario.nombre,
        nuevoUsuario.nombreUsuario,
        nuevoUsuario.correoElectronico,
        nuevoUsuario.contrasena,
        nuevoUsuario.fechaRegistro,
        nuevoUsuario.estaActivo
      ]
    );

    await connection.end();

    res.status(201).json(
      new ResultadoInicioSesion(true, nuevoUsuario.toJSON(), null)
    );

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json(
      new ResultadoInicioSesion(false, null, 'Error interno del servidor')
    );
  }
};
 
exports.obtenerUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const connection = await connectDB();
    const [usuarios] = await connection.execute(
      'SELECT * FROM usuarios WHERE id = ?',
      [id]
    );

    if (usuarios.length === 0) {
      await connection.end();
      return res.status(404).json({
        mensaje: 'Usuario no encontrado'
      });
    }

    const datosUsuario = usuarios[0];
    const usuario = new Usuario({
      id: datosUsuario.id,
      nombre: datosUsuario.nombre,
      nombreUsuario: datosUsuario.nombre_usuario,
      correoElectronico: datosUsuario.correo_electronico,
      fechaRegistro: datosUsuario.fecha_registro,
      estaActivo: datosUsuario.esta_activo
    });

    await connection.end();
    res.status(200).json(usuario.toJSON());

  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor'
    });
  }
};