const db = require('../models/db');
const bcryptjs = require('bcryptjs');

exports.login = (req, res) => {
    const { user, password } = req.body;

    app.use(session({
        secret: 'mi_clave_secreta_segura',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false } 
    }));

    // Validar que los campos no estén vacíos
    if (!user || !password) {
        return res.render('login', { mensajeError: 'Por favor, completa todos los campos.' });
    }

    // Consulta SQL para buscar al usuario por nombre
    const sql = 'SELECT * FROM Usuario WHERE Nombre = ?';
    db.query(sql, [user], async (err, results) => {
        if (err) {
            console.error('Error al buscar usuario:', err);
            return res.status(500).render('login', { mensajeError: 'Error al procesar la solicitud.' });
        }

        // Validar si el usuario existe
        if (results.length === 0) {
            return res.render('login', { mensajeError: 'Usuario no encontrado.' });
        }

        const usuario = results[0];

        // Comparar la contraseña ingresada con la almacenada
        const coincide = await bcryptjs.compare(password, usuario.Contraseña);

        if (!coincide) {
            return res.render('login', { mensajeError: 'Contraseña incorrecta.' });
        }

       // Guardar el mensaje de bienvenida en la sesión
        req.session.mensajeBienvenida = `Inicio de sesión exitoso como ${usuario.Rol}`;

        // Redirigir según el rol del usuario
        if (usuario.Rol === 'Administrador') {
            return res.redirect('/admin');
        } else if (usuario.Rol === 'Cliente') {
            return res.redirect('/home');
        } else {
            return res.render('login', { mensajeError: 'Rol no reconocido.' });
        }
        
    });
};
