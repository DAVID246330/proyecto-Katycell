const db = require('../models/db');
const bcryptjs = require('bcryptjs');

exports.login = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.render('login', { mensajeError: 'Por favor, completa todos los campos.' });
    }

    const sql = 'SELECT * FROM Usuario WHERE Correo_Electronico = ?';
    db.query(sql, [email], async (err, results) => {
        if (err) {
            console.error('Error al buscar usuario:', err);
            return res.status(500).render('login', { mensajeError: 'Error al procesar la solicitud.' });
        }

        if (results.length === 0) {
            return res.render('login', { mensajeError: 'Usuario no encontrado.' });
        }

        const usuario = results[0];
        const coincide = await bcryptjs.compare(password, usuario.Contraseña);

        if (!coincide) {
            return res.render('login', { mensajeError: 'Contraseña incorrecta.' });
        }

        // ✅ Guardar el usuario completo en sesión
        req.session.usuario = usuario;

        // ✅ Mensaje de bienvenida
        req.session.mensaje = `Inicio de sesión exitoso como ${usuario.Rol}`;

        // ✅ Redirigir según el rol
        if (usuario.Rol === 'Administrador') {
            return res.redirect('/admin');
        } else if (usuario.Rol === 'Cliente') {
            return res.redirect('/home');
        } else {
            return res.render('login', { mensajeError: 'Rol no reconocido.' });
        }
    });
};
