const pool = require('../models/db');

/** =========================
 *  VISTA DE REPORTES
 *  ========================= */
exports.vistaReportes = async (req, res) => {
  try {
    const { rows: pedidos } = await pool.query(`
      SELECT
        p.id_pedido,
        p.fecha_pedido,
        p.total,
        u.nombre
      FROM pedido p
      JOIN usuario u ON p.id_usuario = u.id_usuario
      ORDER BY p.id_pedido DESC
    `);

    res.render('admin_reportes', { pedidos });
  } catch (err) {
    console.error('❌ Error al obtener reportes:', err);
    res.status(500).send('Error al cargar los reportes');
  }
};

/** =========================
 *  REPORTE DE COMPRA DETALLADO
 *  ========================= */
exports.reporteCompra = async (req, res) => {
  const idPedido = req.query.id;
  if (!idPedido) {
    return res.status(400).send('Falta el ID del pedido');
  }

  const sql = `
    SELECT 
      p.id_pedido,
      p.fecha_pedido AS fecha,
      p.total,
      u.nombre,
      u.correo_electronico AS email,
      u.direccion,
      u.telefono,
      dp.cantidad,
      dp.precio AS precio_unitario,
      pr.nombre AS nombre_producto,
      pa.monto,
      pa.fecha_pago,
      pa.estado_pago,
      mp.nombre_metodo AS metodo_pago
    FROM pedido p
    JOIN usuario u           ON p.id_usuario = u.id_usuario
    JOIN detalle_pedido dp   ON p.id_pedido = dp.id_pedido
    JOIN producto pr         ON dp.id_producto = pr.id_producto
    LEFT JOIN pago pa        ON p.id_pedido = pa.pedido_id_pedido
    LEFT JOIN metodo_pago mp ON pa.metodo_pago_id_metodo_pago = mp.id_metodo_pago
    WHERE p.id_pedido = $1
  `;

  try {
    const { rows } = await pool.query(sql, [idPedido]);
    if (rows.length === 0) {
      return res.status(404).send('Pedido no encontrado');
    }

    // Construir objeto pedido (tomamos los datos del primer row)
    const first = rows[0];
    const pedido = {
      id_pedido:    first.id_pedido,
      fecha:        first.fecha,
      total:        Number(first.total) || 0,
      monto:        first.monto != null ? Number(first.monto) : null,
      fecha_pago:   first.fecha_pago,
      estado_pago:  first.estado_pago,
      metodo_pago:  first.metodo_pago
    };

    // Construir objeto usuario
    const usuario = {
      nombre:       first.nombre,
      email:        first.email,
      direccion:    first.direccion,
      telefono:     first.telefono
    };

    // Construir array de detalles
    const detalles = rows.map(r => ({
      nombre_producto:  r.nombre_producto,
      cantidad:         parseInt(r.cantidad, 10) || 0,
      precio_unitario:  Number(r.precio_unitario) || 0
    }));

    // Renderizar la vista con los datos
    res.render('reporte-compra', { pedido, usuario, detalles });
  } catch (err) {
    console.error('❌ Error en consulta reporte compra:', err);
    res.status(500).send('Error al obtener el reporte de compra');
  }
};
