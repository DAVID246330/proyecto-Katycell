const pool = require('../models/db'); // conexión con PostgreSQL
const bcryptjs = require('bcryptjs');

// LOGIN
exports.login = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.render('login', { mensajeError: 'Por favor, completa todos los campos.' });
    }

    const sql = 'SELECT * FROM usuario WHERE correo_electronico = $1';
    pool.query(sql, [email], async (err, results) => {
        if (err) {
            console.error('Error al buscar usuario:', err);
            return res.status(500).render('login', { mensajeError: 'Error al procesar la solicitud.' });
        }

        if (results.rows.length === 0) {
            return res.render('login', { mensajeError: 'Usuario no encontrado.' });
        }

        const usuario = results.rows[0];
        const coincide = await bcryptjs.compare(password, usuario.contrasena); // OJO: debe coincidir el nombre del campo

        if (!coincide) {
            return res.render('login', { mensajeError: 'Contraseña incorrecta.' });
        }

        req.session.usuario = usuario;
        req.session.mensaje = `Inicio de sesión exitoso como ${usuario.rol}`;

        if (usuario.rol === 'Administrador') {
            return res.redirect('/admin');
        } else if (usuario.rol === 'Cliente') {
            return res.redirect('/home');
        } else {
            return res.render('login', { mensajeError: 'Rol no reconocido.' });
        }
    });
};

// REGISTRO
exports.register = async (req, res) => {
    const { user, email, password, telefono, direccion } = req.body;
    const rol = 'Cliente';

    if (!user || !email || !password || !telefono || !direccion) {
        return res.render('register', { mensajeError: 'Todos los campos son obligatorios.' });
    }

    try {
        const checkUser = await pool.query('SELECT * FROM usuario WHERE correo_electronico = $1', [email]);
        if (checkUser.rows.length > 0) {
            return res.render('register', { mensajeError: 'El correo ya está registrado.' });
        }

        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        const queryText = `
            INSERT INTO usuario (nombre, correo_electronico, contrasena, telefono, direccion, rol)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id_usuario
        `;
        const values = [user, email, hashedPassword, telefono, direccion, rol];

        await pool.query(queryText, values);
        res.redirect('/api/login');
    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        res.status(500).render('register', { mensajeError: 'Error interno al registrar el usuario.' });
    }
};
