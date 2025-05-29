// app.js o index.js

const express = require('express');
const session = require('express-session'); // ✅ ESTA LÍNEA ES OBLIGATORIA
const path = require('path');
const app = express();
const PORT = 4000;

// ==============================
//  CONEXIÓN A LA BASE DE DATOS
// ==============================
require('./models/db');

// =====================
//  MIDDLEWARES GLOBALES
// =====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Configurar sesiones antes de las rutas
app.use(session({
    secret: 'clave_secreta_segura',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false, // para desarrollo local
        sameSite: 'lax' // permite redirecciones entre páginas en el mismo sitio
    }
}));


// Archivos estáticos (CSS, JS, imágenes, etc.)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


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
