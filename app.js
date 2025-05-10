// app.js o index.js

const express = require('express');
const path = require('path');
const app = express();
const PORT = 5000;
const session = require('express-session');

// ==============================
//  CONEXIÓN A LA BASE DE DATOS
// ==============================
require('./models/db');

// =====================
//  MIDDLEWARES GLOBALES
// =====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos estáticos (CSS, JS, imágenes, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// ========================
//  CONFIGURACIÓN DEL MOTOR DE VISTAS
// ========================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ========================
//  RUTAS
// ========================

// Rutas de productos (vista principal, admin, agregar, eliminar...)
const productRoutes = require('./routes/productRoutes');
app.use('/', productRoutes); // Rutas disponibles desde "/"

// Rutas de usuarios (registro, login, etc.)
const usuarioRoutes = require('./routes/usuarioRoutes');
app.use('/api', usuarioRoutes); // Accesibles como "/api/..."


// ========================
//  INICIAR SERVIDOR
// ========================
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en: http://localhost:${PORT}`);
});
