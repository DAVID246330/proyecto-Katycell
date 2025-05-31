// routes/productRoutes.js
const express = require('express');
const router = express.Router();

// 🧩 Middlewares
const upload = require('../middlewares/upload');
const sessionMensaje = require('../middlewares/sessionMensaje');
const verificarSesion = require('../middlewares/verificarSesion');

// 🎯 Controladores
const productosController = require('../controllers/productController');
const carritoController = require('../controllers/carritoController');
const reporteController = require('../controllers/reporteController');
// ==========================
// 📦 RUTAS DE PRODUCTOS
// ==========================

// 🆕 Agregar un nuevo producto (incluye subida de imagen)
router.post('/productos/agregar', upload.single('imagen'), productosController.agregarProducto);

// 🛠️ Vista de administración de productos (requiere sesión activa)
router.get('/admin', /*verificarSesion,*/ sessionMensaje, productosController.mostrarProductosAdmin);

// 🏠 Mostrar productos en la página principal
router.get('/home', sessionMensaje, productosController.mostrarProductosHome);

// ❌ Eliminar producto por ID
router.post('/productos/eliminar/:id_producto', productosController.eliminarProducto);

// ==========================
// 🛒 RUTAS DEL CARRITO
// ==========================

// 💾 Guardar carrito en sesión (usado al finalizar compra desde frontend)
router.post('/carrito/guardar', carritoController.guardarCarritoEnSesion);



// ✅ Mostrar formulario de confirmación de compra
router.get('/carrito/confirmar', carritoController.mostrarConfirmacionCompra);

// 🧾 Procesar la compra (descontar stock, registrar orden, etc.)
router.post('/carrito/finalizar', carritoController.finalizarCompra);

router.get('/pedido-exitoso', carritoController.pedidoExitoso); 

// 🔍 Detalle de producto por ID
router.get('/producto/:id', productosController.detalleProductoVista);

router.get('/reporte-compra', reporteController.reporteCompra);

router.get('/admin/reportes', reporteController.vistaReportes);

// Redirige '/' a '/home'
router.get('/', (req, res) => {
    res.redirect('/home');
});

// ==========================
// ✅ EXPORTACIÓN
// ==========================
module.exports = router;
