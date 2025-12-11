-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id VARCHAR(36) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  nombreUsuario VARCHAR(50) NOT NULL UNIQUE,
  correoElectronico VARCHAR(100) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  fechaRegistro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estaActivo BOOLEAN DEFAULT TRUE,
  INDEX idx_nombreUsuario (nombreUsuario),
  INDEX idx_correoElectronico (correoElectronico)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
