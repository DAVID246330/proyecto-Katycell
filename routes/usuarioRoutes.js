const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// Ruta GET para renderizar el formulario de login
router.get('/login', (req, res) => {
    res.render('login', { mensajeError: null });  // Muestra el formulario sin errores
});

// Ruta POST para procesar el login
router.post('/login', usuarioController.login);  // Usamos el controlador 'login' para manejar el formulario



module.exports = router;


