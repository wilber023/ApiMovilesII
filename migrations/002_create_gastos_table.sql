-- Crear tabla de gastos
CREATE TABLE IF NOT EXISTS gastos (
  id VARCHAR(36) PRIMARY KEY,
  usuarioId VARCHAR(36) NOT NULL,
  monto DECIMAL(10, 2) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  descripcion TEXT NOT NULL,
  fecha TIMESTAMP NOT NULL,
  fechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuarioId) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_usuarioId (usuarioId),
  INDEX idx_categoria (categoria),
  INDEX idx_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
