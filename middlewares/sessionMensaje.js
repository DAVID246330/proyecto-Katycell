const sessionMensaje = (req, res, next) => {
    res.locals.mensaje = req.session.mensaje;
    delete req.session.mensaje;
    next();
  };
  
  module.exports = sessionMensaje;
  
  