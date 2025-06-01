const pool = require('../models/db'); // tu pool de pg
const bcryptjs = require('bcryptjs');

/** =========================
 *  AGREGAR PRODUCTO
 *  ========================= */
exports.agregarProducto = async (req, res) => {
  const {
    nombre,
    descripcion,
    precio,
    precio_descuento,
    stock,
    id_categoria
  } = req.body;

  // Validar imagen
  if (!req.file) {
    return res.status(400).send('Por favor, sube una imagen.');
  }

  // ✅ Usar la URL pública de Cloudinary
  const imagen = req.file.path;

  try {
    // 1. Verificar si existe el producto
    const { rows: existentes } = await pool.query(
      'SELECT * FROM producto WHERE nombre = $1',
      [nombre]
    );

    if (existentes.length > 0) {
      // Actualizar stock si ya existe
      const nuevoStock = existentes[0].stock + parseInt(stock, 10);
      await pool.query(
        'UPDATE producto SET stock = $1 WHERE id_producto = $2',
        [nuevoStock, existentes[0].id_producto]
      );
      console.log('✅ Stock actualizado correctamente');
      return res.redirect('/admin');
    }

    // 2. Insertar nuevo producto
    await pool.query(
      `INSERT INTO producto
        (nombre, descripcion, precio, precio_descuento, stock, imagen, id_categoria)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [nombre, descripcion, precio, precio_descuento, stock, imagen, id_categoria]
    );
    console.log('✅ Producto insertado correctamente');
    res.redirect('/admin');

  } catch (err) {
    console.error('❌ Error en agregarProducto:', err);
    res.status(500).send('Error al procesar el producto');
  }
};
/** =========================
 *  MOSTRAR PRODUCTOS EN /admin 
 *  ========================= */
exports.mostrarProductosAdmin = async (req, res) => {
  const buscar = req.query.buscar || '';
  let query = 'SELECT * FROM producto';
  const valores = [];

  if (buscar) {
    query += ' WHERE nombre ILIKE $1';
    valores.push(`%${buscar}%`);
  }

  try {
    const { rows: productos } = await pool.query(query, valores);
    const { rows: categorias } = await pool.query('SELECT * FROM categoria');
    res.render('admin', {
      title: 'Administración - Katicell',
      productos,
      categorias,
      buscar
    });
  } catch (err) {
    console.error('❌ Error en mostrarProductosAdmin:', err);
    res.status(500).send('Error al cargar los productos');
  }
};

/** =========================
 *  ELIMINAR PRODUCTO EN ADMIN
 *  ========================= */
exports.eliminarProducto = async (req, res) => {
  const id = req.params.id_producto;
  try {
    await pool.query('DELETE FROM producto WHERE id_producto = $1', [id]);
    console.log(`✅ Producto con ID ${id} eliminado correctamente`);
    res.redirect('/admin');
  } catch (err) {
    console.error('❌ Error en eliminarProducto:', err);
    res.status(500).send('Error al eliminar el producto');
  }
};

/** =========================
 *  DETALLE DE PRODUCTO POR ID
 *  ========================= */
exports.detalleProductoVista = async (req, res) => {
  const id = req.params.id;
  try {
    const { rows } = await pool.query(
      `SELECT id_producto, nombre, descripcion, precio, precio_descuento, imagen, stock
       FROM producto
       WHERE id_producto = $1`,
      [id]
    );
    if (rows.length === 0) throw new Error('Producto no encontrado');
    res.render('detalle-prod', { producto: rows[0] });
  } catch (err) {
    console.error('❌ Error en detalleProductoVista:', err);
    res.status(500).send('Producto no disponible');
  }
};

/** =========================
 *  MOSTRAR PRODUCTOS EN LA PÁGINA DE INICIO
 *  ========================= */
exports.mostrarProductosHome = async (req, res) => {
  const buscar = req.query.buscar || '';
  const categoria = req.query.categoria || '';
  const pagina = parseInt(req.query.page, 10) || 1;
  const porPagina = 9;
  const offset = (pagina - 1) * porPagina;

  const condiciones = [];
  const valores = [];

  if (buscar) {
    condiciones.push(`p.nombre ILIKE $${valores.length + 1}`);
    valores.push(`%${buscar}%`);
  }
  if (categoria) {
    condiciones.push(`p.id_categoria = $${valores.length + 1}`);
    valores.push(categoria);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const totalQuery = `
    SELECT COUNT(*) AS total
    FROM producto p
    ${where}
  `;
  const dataQuery = `
    SELECT p.*, c.nombre_categoria
    FROM producto p
    JOIN categoria c ON p.id_categoria = c.id_categoria
    ${where}
    ORDER BY p.id_producto DESC
    LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}
  `;
  valores.push(porPagina, offset);

  try {
    const totalRes = await pool.query(totalQuery, valores.slice(0, valores.length - 2));
    const total = parseInt(totalRes.rows[0].total, 10);
    const paginas = Math.ceil(total / porPagina);

    const prodRes = await pool.query(dataQuery, valores);
    const catRes = await pool.query('SELECT * FROM categoria');

    res.render('home', {
      title: 'Katicell | Inicio',
      productos: prodRes.rows,
      categorias: catRes.rows,
      buscar,
      categoriaSeleccionada: categoria,
      usuario: req.session.usuario || null,
      pagina,
      totalPaginas: paginas
    });
  } catch (err) {
    console.error('❌ Error en mostrarProductosHome:', err);
    res.status(500).send('Error al cargar la página de inicio');
  }
};

/** =========================
 *  REPORTE DE COMPRA
 *  ========================= */
exports.reporteCompra = async (req, res) => {
  const idPedido = req.query.id;
  if (!idPedido) return res.status(400).send('Falta el ID del pedido');

  const sql = `
    SELECT 
      p.id_pedido, p.fecha_pedido AS fecha, p.total,
      u.nombre, u.correo_electronico AS email, u.direccion, u.telefono,
      dp.cantidad, dp.precio,
      pr.nombre AS nombre_producto
    FROM pedido p
    JOIN usuario u ON p.id_usuario = u.id_usuario
    JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
    JOIN producto pr ON dp.id_producto = pr.id_producto
    WHERE p.id_pedido = $1
  `;

  try {
    const { rows } = await pool.query(sql, [idPedido]);
    if (rows.length === 0) return res.status(404).send('Pedido no encontrado');

    const pedido = {
      id_pedido: rows[0].id_pedido,
      fecha: rows[0].fecha,
      total: rows[0].total
    };
    const usuario = {
      nombre: rows[0].nombre,
      email: rows[0].email,
      direccion: rows[0].direccion,
      telefono: rows[0].telefono
    };
    const detalles = rows.map(r => ({
      nombre_producto: r.nombre_producto,
      cantidad: r.cantidad,
      precio_unitario: r.precio
    }));

    res.render('reporte-compra', { pedido, usuario, detalles });
  } catch (err) {
    console.error('❌ Error en reporteCompra:', err);
    res.status(500).send('Error al obtener el reporte de compra');
  }
};
