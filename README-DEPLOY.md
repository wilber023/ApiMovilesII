# Guía de Deploy - Expense Tracker API

Esta guía te ayudará a desplegar la API en una instancia EC2 de Amazon Web Services.

## Requisitos Previos

### 1. Instancia EC2
- Sistema operativo: Ubuntu 20.04 o 22.04 LTS
- Tipo de instancia recomendado: t2.micro o superior
- Almacenamiento: Mínimo 8GB

### 2. Configuración de Seguridad (Security Group)
Asegúrate de tener los siguientes puertos abiertos en tu Security Group:

| Puerto | Tipo | Origen | Descripción |
|--------|------|--------|-------------|
| 22 | SSH | Tu IP | Conexión SSH |
| 3000 | TCP | 0.0.0.0/0 | API HTTP |
| 80 | HTTP | 0.0.0.0/0 | (Opcional) Para proxy reverso |

## Pasos de Deploy

### Paso 1: Conectarse a la instancia EC2

```bash
ssh -i tu-llave.pem ubuntu@tu-ip-publica
```

### Paso 2: Clonar o subir el proyecto

**Opción A: Clonar desde Git (recomendado)**
```bash
git clone https://github.com/tu-usuario/tu-repo.git
cd tu-repo
```

**Opción B: Subir archivos con SCP**
```bash
# Desde tu máquina local
scp -i tu-llave.pem -r ./ApiMovilesII ubuntu@tu-ip-publica:~/
```

### Paso 3: Dar permisos de ejecución al script de deploy

```bash
chmod +x deploy.sh
```

### Paso 4: Ejecutar el script de deploy

```bash
./deploy.sh
```

El script automáticamente:
- ✅ Actualiza el sistema
- ✅ Instala Node.js 20.x
- ✅ Instala MySQL Server
- ✅ Configura MySQL con usuario y contraseña
- ✅ Crea el archivo .env
- ✅ Instala dependencias de npm
- ✅ Ejecuta las migraciones de base de datos
- ✅ Instala PM2 globalmente
- ✅ Inicia la aplicación con PM2
- ✅ Configura PM2 para auto-inicio en el sistema

### Paso 5: Verificar que todo funciona

Prueba la API:
```bash
curl http://localhost:3000
```

Deberías ver una respuesta JSON como:
```json
{
  "mensaje": "API Simple de Gestión de Gastos",
  "version": "2.0.0",
  "status": "Funcionando correctamente"
}
```

## Configuración Post-Deploy

### Variables de Entorno

El script crea automáticamente un archivo `.env` con valores por defecto. **Es importante que revises y actualices las credenciales:**

```bash
nano .env
```

Valores por defecto:
```env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=ExpenseAPI2024!
MYSQL_DATABASE=expense_tracker_simple
PORT=3000
NODE_ENV=production
```

⚠️ **Importante**: Cambia el password de MySQL por uno seguro.

Después de modificar el `.env`, reinicia la aplicación:
```bash
pm2 restart expense-api
```

## Comandos Útiles de PM2

### Ver estado de la aplicación
```bash
pm2 status
```

### Ver logs en tiempo real
```bash
pm2 logs expense-api
```

### Ver logs históricos
```bash
pm2 logs expense-api --lines 100
```

### Reiniciar la aplicación
```bash
pm2 restart expense-api
```

### Detener la aplicación
```bash
pm2 stop expense-api
```

### Iniciar la aplicación
```bash
pm2 start expense-api
```

### Monitoreo en tiempo real
```bash
pm2 monit
```

### Ver información detallada
```bash
pm2 show expense-api
```

## Gestión de Base de Datos

### Conectarse a MySQL
```bash
mysql -u root -p
```

### Ver bases de datos
```sql
SHOW DATABASES;
USE expense_tracker_simple;
SHOW TABLES;
```

### Ver migraciones ejecutadas
```sql
SELECT * FROM migrations;
```

### Ejecutar migraciones manualmente
```bash
npm run migrate
```

## Actualizar la Aplicación

Cuando hagas cambios en el código:

```bash
# 1. Detener la aplicación
pm2 stop expense-api

# 2. Obtener últimos cambios (si usas Git)
git pull origin main

# 3. Instalar nuevas dependencias (si las hay)
npm install --production

# 4. Ejecutar nuevas migraciones (si las hay)
npm run migrate

# 5. Reiniciar la aplicación
pm2 restart expense-api
```

## Acceso a la API

### Desde tu aplicación cliente

Usa la IP pública de tu instancia EC2:
```
http://TU-IP-PUBLICA:3000
```

### Endpoints disponibles

```
GET  /                              # Info de la API
POST /api/usuarios/registro         # Registrar usuario
POST /api/usuarios/login            # Login de usuario
GET  /api/gastos/usuario/:id        # Obtener gastos de un usuario
POST /api/gastos                    # Crear nuevo gasto
GET  /api/gastos/categorias         # Obtener categorías
GET  /api/gastos/usuario/:id/resumen # Resumen de gastos
```

## Configurar Dominio (Opcional)

Si tienes un dominio, puedes configurar NGINX como proxy reverso:

### 1. Instalar NGINX
```bash
sudo apt-get install nginx -y
```

### 2. Configurar NGINX
```bash
sudo nano /etc/nginx/sites-available/expense-api
```

Contenido:
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Habilitar configuración
```bash
sudo ln -s /etc/nginx/sites-available/expense-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Solución de Problemas

### La aplicación no inicia
```bash
# Ver logs de errores
pm2 logs expense-api --err

# Verificar el proceso
pm2 status
```

### Error de conexión a MySQL
```bash
# Verificar que MySQL está corriendo
sudo systemctl status mysql

# Iniciar MySQL si está detenido
sudo systemctl start mysql

# Verificar credenciales en .env
cat .env
```

### Puerto 3000 ocupado
```bash
# Ver qué proceso usa el puerto
sudo lsof -i :3000

# Matar el proceso
sudo kill -9 PID
```

### Reiniciar todo desde cero
```bash
# Detener PM2
pm2 delete all

# Eliminar base de datos
mysql -u root -p -e "DROP DATABASE expense_tracker_simple;"

# Ejecutar deploy nuevamente
./deploy.sh
```

## Monitoreo y Logs

### Archivos de logs
Los logs de PM2 se guardan en:
```
./logs/out.log       # Salida estándar
./logs/err.log       # Errores
./logs/combined.log  # Logs combinados
```

### Ver logs
```bash
# Últimas 50 líneas
tail -f logs/out.log

# Ver errores
tail -f logs/err.log
```

## Backup de Base de Datos

### Crear backup
```bash
mysqldump -u root -p expense_tracker_simple > backup_$(date +%Y%m%d).sql
```

### Restaurar backup
```bash
mysql -u root -p expense_tracker_simple < backup_20240101.sql
```

## Seguridad

### Cambiar password de MySQL
```bash
mysql -u root -p

ALTER USER 'root'@'localhost' IDENTIFIED BY 'NuevoPasswordSeguro';
FLUSH PRIVILEGES;
```

No olvides actualizar el `.env` y reiniciar la app.

### Configurar firewall UFW
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 3000/tcp
sudo ufw status
```

## Soporte

Si encuentras problemas:

1. Revisa los logs: `pm2 logs expense-api`
2. Verifica el estado: `pm2 status`
3. Revisa la conexión a MySQL: `mysql -u root -p`
4. Verifica las variables de entorno en `.env`

---

## Estructura del Proyecto

```
ApiMovilesII/
├── config/
│   ├── db.js                 # Configuración de MySQL
│   └── memoryStore.js        # Store de memoria
├── controllers/
│   ├── gastoController.js    # Lógica de gastos
│   └── usuarioController.js  # Lógica de usuarios
├── migrations/
│   ├── migrate.js                      # Sistema de migraciones
│   ├── 001_create_usuarios_table.sql   # Tabla usuarios
│   └── 002_create_gastos_table.sql     # Tabla gastos
├── models/
│   ├── Gasto.js              # Modelo de gasto
│   └── User.js               # Modelo de usuario
├── routes/
│   ├── gastos.js             # Rutas de gastos
│   └── usuarios.js           # Rutas de usuarios
├── logs/                     # Logs de PM2
├── .env                      # Variables de entorno
├── .env.example              # Ejemplo de variables
├── ecosystem.config.js       # Configuración de PM2
├── deploy.sh                 # Script de deploy
├── package.json              # Dependencias
└── server.js                 # Punto de entrada

```

¡Listo! Tu API debería estar funcionando correctamente en EC2. 🚀
