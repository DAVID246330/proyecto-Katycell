const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// LOGIN
router.get('/login', (req, res) => {
    res.render('login', { mensajeError: null });
});
router.post('/login', usuarioController.login);

// REGISTRO
router.get('/register', (req, res) => {
    res.render('register', { mensajeError: null });
});
router.post('/register', usuarioController.register);

module.exports = router;

