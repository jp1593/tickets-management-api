# 🧾 Tickets Management API

API REST para la gestión de tickets, proveedores, productos y ubicaciones.

---

## 🚀 Tecnologías

* Node.js
* Express
* PostgreSQL
* Sequelize ORM

---

## 📋 Requisitos

* Node.js >= 18
* PostgreSQL instalado y corriendo
* npm o yarn

---

## ⚙️ Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/jp1593/tickets-management-api.git
cd tickets-management-api
```

### 2. Instalar dependencias

```bash
npm install
```

---

## 🔐 Variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
DB_USER=tickets_user
DB_PASSWORD=123456
DB_NAME=tickets_db
DB_HOST=127.0.0.1
DB_DIALECT=postgres
PORT=3000
```

---

## 🗄️ Base de datos

### 1. Crear la base de datos en PostgreSQL

```sql
CREATE DATABASE tickets_db;
```

### 2. Ejecutar migraciones

```bash
npx sequelize-cli db:migrate
```

---

## 📥 Carga de datos inicial (Excel)

El proyecto incluye un script para importar datos desde un archivo Excel ubicado en:

```
data/tickets-prueba.xlsx
```

### Ejecutar importación

```bash
node runImport.js
```

### ¿Qué hace este script?

* Lee el archivo Excel
* Normaliza los datos
* Inserta:

  * Suppliers
  * Lands
  * Products
  * Tickets
  * TicketItems
* Usa transacciones para asegurar integridad

---

## ▶️ Ejecución del servidor

```bash
node src/app.js
```

Servidor disponible en:

```
http://localhost:3000/api
```

---

## 📡 Endpoints principales

### Tickets

* `GET /api/tickets`
* `GET /api/tickets/:id`
* `POST /api/tickets`
* `DELETE /api/tickets/:id`

### Catálogos

* `GET /api/suppliers`
* `GET /api/products`
* `GET /api/lands`

### Pagos

* `GET /api/payments/summary`
* `GET /api/payments/dashboard-stats`

---

## 🧠 Notas importantes

* Los `TicketItems` se eliminan automáticamente al eliminar un ticket (CASCADE).
* El total del ticket se calcula dinámicamente.
* Se utilizan transacciones para garantizar integridad de datos.

---

## 🧪 Flujo recomendado de ejecución

1. Instalar dependencias
2. Configurar `.env`
3. Crear base de datos
4. Ejecutar migraciones
5. Importar datos con Excel
6. Levantar servidor

---

## Documentación

Existe una carpeta denominada docs, la cual contiene lo siguiente: 
- Documento pdf con resumen técnico de lo realizado y analisís de datos
- Vídeo demostrativo del sistema
- Diagrama entidad/relacion

---

## 👨‍💻 Autor

Juan Pablo Estrada Lucero

Proyecto desarrollado como prueba técnica.
