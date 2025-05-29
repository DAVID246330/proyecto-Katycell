const db = require('../models/db');

exports.vistaReportes = (req, res) => {
    const sql = `
      SELECT p.ID_Pedido, p.Fecha_Pedido, p.Total, u.Nombre 
      FROM pedido p
      JOIN usuario u ON p.ID_Usuario = u.ID_Usuario
      ORDER BY p.ID_Pedido DESC
    `;
  
    db.query(sql, (err, resultados) => {
      if (err) {
        console.error('Error al obtener reportes:', err);
        return res.status(500).send('Error al cargar los reportes');
      }
  
      res.render('admin_reportes', { pedidos: resultados });
    });
  };
  

exports.reporteCompra = (req, res) => {
  const idPedido = req.query.id;

  if (!idPedido) {
    return res.status(400).send('Falta el ID del pedido');
  }

  const sql = `
SELECT 
  p.ID_Pedido, p.Fecha_Pedido, p.Total,
  u.Nombre, u.Correo_Electronico, u.Dirección, u.Teléfono,
  dp.Cantidad, IFNULL(dp.Precio, 0) AS PrecioUnitario,
  pr.Nombre AS NombreProducto,
  pa.monto, pa.fecha_pago, pa.estado_pago,
  mp.nombre_metodo AS Metodo_Pago
FROM pedido p
JOIN usuario u ON p.ID_Usuario = u.ID_Usuario
JOIN detalle_pedido dp ON p.ID_Pedido = dp.ID_Pedido
JOIN producto pr ON dp.ID_Producto = pr.ID_Producto
LEFT JOIN pago pa ON p.ID_Pedido = pa.pedido_ID_Pedido
LEFT JOIN metodo_pago mp ON pa.metodo_pago_ID_metodo_pago = mp.ID_metodo_pago
WHERE p.ID_Pedido = ?
  `;

  db.query(sql, [idPedido], (err, resultados) => {
    if (err) {
      console.error('Error en consulta reporte compra:', err);
      return res.status(500).send('Error al obtener el reporte de compra');
    }

    if (resultados.length === 0) {
      return res.status(404).send('Pedido no encontrado');
    }

    // Datos del pedido
    const pedido = {
      ID_Pedido: resultados[0].ID_Pedido,
      Fecha_Pedido: resultados[0].Fecha_Pedido,
      Total: parseFloat(resultados[0].Total) || 0,
      monto: resultados[0].monto || null,
      Fecha_Pago: resultados[0].fecha_pago || null,
      estado_pago: resultados[0].estado_pago || null,
      metodo_pago: resultados[0].Metodo_Pago || null,
    };

    // Datos del usuario
    const usuario = {
      Nombre: resultados[0].Nombre,
      Correo_Electronico: resultados[0].Correo_Electronico,
      Dirección: resultados[0].Dirección,
      Teléfono: resultados[0].Teléfono
    };

    // Detalles del pedido
    const detalles = resultados.map(row => ({
      NombreProducto: row.NombreProducto,
      Cantidad: parseInt(row.Cantidad) || 0,
      PrecioUnitario: parseFloat(row.PrecioUnitario) || 0
    }));

    // Renderizamos la vista con los datos
    res.render('reporte-compra', { pedido, usuario, detalles });
  });
};
