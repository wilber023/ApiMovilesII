#!/bin/bash

#############################################
# Script de Deploy Automático para EC2
# API de Gestión de Gastos
#############################################

set -e  # Detener el script si hay errores

echo "================================================"
echo "  Iniciando Deploy de Expense Tracker API"
echo "================================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir en verde
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Función para imprimir en amarillo
print_info() {
    echo -e "${YELLOW}➜ $1${NC}"
}

# Función para imprimir en rojo
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

#############################################
# 1. Verificar que estamos en el directorio correcto
#############################################
print_info "Verificando directorio del proyecto..."

if [ ! -f "package.json" ]; then
    print_error "Error: No se encuentra package.json. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

print_success "Directorio correcto"

#############################################
# 2. Actualizar sistema (solo en primera ejecución)
#############################################
print_info "Actualizando sistema operativo..."

sudo apt-get update -y
print_success "Sistema actualizado"

#############################################
# 3. Instalar Node.js y npm si no están instalados
#############################################
print_info "Verificando instalación de Node.js..."

if ! command -v node &> /dev/null; then
    print_info "Node.js no encontrado. Instalando Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_success "Node.js instalado"
else
    print_success "Node.js ya está instalado ($(node -v))"
fi

#############################################
# 4. Instalar MySQL Server si no está instalado
#############################################
print_info "Verificando instalación de MySQL..."

if ! command -v mysql &> /dev/null; then
    print_info "MySQL no encontrado. Instalando MySQL Server..."
    sudo apt-get install -y mysql-server

    # Iniciar MySQL
    sudo systemctl start mysql
    sudo systemctl enable mysql

    print_success "MySQL instalado y en ejecución"

    print_info "Configurando MySQL..."
    print_info "IMPORTANTE: Configura una contraseña segura para root"

    # Configuración básica de MySQL
    sudo mysql <<EOF
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'ExpenseAPI2024!';
FLUSH PRIVILEGES;
EOF

    print_success "MySQL configurado"
    print_info "Password de MySQL root establecido: ExpenseAPI2024!"
    print_info "Cambia este password en el archivo .env"
else
    print_success "MySQL ya está instalado"
fi

#############################################
# 5. Configurar archivo .env si no existe
#############################################
print_info "Configurando variables de entorno..."

if [ ! -f ".env" ]; then
    print_info "Creando archivo .env desde .env.example..."

    cat > .env <<EOF
# Configuración de MySQL
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=ExpenseAPI2024!
MYSQL_DATABASE=expense_tracker_simple

# Puerto del servidor
PORT=3000

# Entorno
NODE_ENV=production
EOF

    print_success "Archivo .env creado"
    print_info "IMPORTANTE: Revisa y actualiza las credenciales en .env si es necesario"
else
    print_success "Archivo .env ya existe"
fi

#############################################
# 6. Instalar dependencias de Node.js
#############################################
print_info "Instalando dependencias de npm..."

npm install --production
print_success "Dependencias instaladas"

#############################################
# 7. Ejecutar migraciones de base de datos
#############################################
print_info "Ejecutando migraciones de base de datos..."

npm run migrate

if [ $? -eq 0 ]; then
    print_success "Migraciones ejecutadas correctamente"
else
    print_error "Error al ejecutar migraciones"
    print_info "Verifica las credenciales de MySQL en el archivo .env"
    exit 1
fi

#############################################
# 8. Instalar PM2 globalmente si no está instalado
#############################################
print_info "Verificando instalación de PM2..."

if ! command -v pm2 &> /dev/null; then
    print_info "PM2 no encontrado. Instalando PM2..."
    sudo npm install -g pm2

    # Configurar PM2 para iniciarse con el sistema
    sudo pm2 startup systemd -u $USER --hp $HOME

    print_success "PM2 instalado"
else
    print_success "PM2 ya está instalado"
fi

#############################################
# 9. Crear directorio de logs
#############################################
print_info "Creando directorio de logs..."

mkdir -p logs
print_success "Directorio de logs creado"

#############################################
# 10. Detener procesos PM2 existentes
#############################################
print_info "Deteniendo procesos existentes de PM2..."

pm2 delete expense-api 2>/dev/null || true
print_success "Procesos anteriores detenidos"

#############################################
# 11. Iniciar aplicación con PM2
#############################################
print_info "Iniciando aplicación con PM2..."

pm2 start ecosystem.config.js
print_success "Aplicación iniciada"

#############################################
# 12. Guardar configuración de PM2
#############################################
print_info "Guardando configuración de PM2..."

pm2 save
print_success "Configuración guardada"

#############################################
# 13. Configurar firewall para permitir puerto 3000
#############################################
print_info "Configurando firewall..."

if command -v ufw &> /dev/null; then
    sudo ufw allow 3000/tcp 2>/dev/null || true
    print_success "Puerto 3000 permitido en firewall"
else
    print_info "UFW no encontrado, omitiendo configuración de firewall"
fi

#############################################
# 14. Mostrar estado de la aplicación
#############################################
echo ""
echo "================================================"
echo "  Estado de la Aplicación"
echo "================================================"
echo ""

pm2 status

echo ""
echo "================================================"
echo "  Deploy Completado Exitosamente!"
echo "================================================"
echo ""

# Obtener IP pública (si está en EC2)
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "localhost")

print_success "La API está corriendo en:"
echo ""
echo "  URL Local:   http://localhost:3000"
echo "  URL Pública: http://$PUBLIC_IP:3000"
echo ""
print_info "Comandos útiles de PM2:"
echo "  - Ver logs:      pm2 logs expense-api"
echo "  - Reiniciar:     pm2 restart expense-api"
echo "  - Detener:       pm2 stop expense-api"
echo "  - Estado:        pm2 status"
echo "  - Monitoreo:     pm2 monit"
echo ""
print_info "Prueba la API:"
echo "  curl http://$PUBLIC_IP:3000"
echo ""

# Mostrar logs en tiempo real
print_info "Mostrando logs (presiona Ctrl+C para salir)..."
echo ""
sleep 2
pm2 logs expense-api --lines 50
