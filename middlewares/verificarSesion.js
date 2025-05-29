module.exports = (req, res, next) => {
  if (!req.session.usuario) {
    console.log('🔒 Usuario no autenticado. Redirigiendo a /login');
    return res.redirect('api/login');
  }

  if (req.session.usuario.Rol !== 'Administrador') {
    console.log('⛔ Acceso denegado. No es administrador.');
    return res.status(403).send('Acceso denegado. No tienes permisos para ver esta página.');
  }

  console.log('✅ Acceso permitido. Usuario administrador:', req.session.usuario.Nombre);
  next();
};

  