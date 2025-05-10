// routes/productRoutes.js

const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productController');

// =========================
//  RUTAS DE PRODUCTOS
// =========================

//  Agregar un nuevo producto
router.post('/productos/agregar', productosController.agregarProducto);

//  Vista de administración (productos + búsqueda)
router.get('/admin', productosController.mostrarProductosAdmin);

//  Mostrar productos en la página de inicio
router.get('/home', productosController.mostrarProductosHome);

//  Eliminar producto por ID
router.post('/productos/eliminar/:ID_Producto', productosController.eliminarProducto);

// Exportar router
module.exports = router;




