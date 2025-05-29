const db = require('../models/db'); // Importar conexión a la base de datos

/** =========================
 *  AGREGAR PRODUCTO
 *  ========================= */
exports.agregarProducto = (req, res) => {
    const {
        Nombre,
        Descripcion,
        Precio,
        Precio_Descuento,
        Stock,
        ID_Categoria
    } = req.body;

    // Validar imagen
    if (!req.file) {
        return res.status(400).send('Por favor, sube una imagen.');
    }

    const Imagen = "/img/" + req.file.filename;

    //  verificamos si ya existe un producto con ese nombre
    const buscarSQL = 'SELECT * FROM producto WHERE Nombre = ?';
    db.query(buscarSQL, [Nombre], (err, resultados) => {
        if (err) {
            console.error('❌ Error al buscar el producto:', err);
            return res.status(500).send('Error al verificar el producto');
        }

        if (resultados.length > 0) {
            // Producto ya existe, actualizamos solo el stock
            const productoExistente = resultados[0];
            const nuevoStock = productoExistente.Stock + parseInt(Stock);

            const actualizarSQL = 'UPDATE producto SET Stock = ? WHERE ID_Producto = ?';
            db.query(actualizarSQL, [nuevoStock, productoExistente.ID_Producto], (err, resultado) => {
                if (err) {
                    console.error('❌ Error al actualizar el stock:', err);
                    return res.status(500).send('Error al actualizar el stock');
                }

                console.log('✅ Stock actualizado correctamente');
                return res.redirect('/admin');
            });

        } else {
            // Producto no existe, se inserta nuevo
            const nuevoProducto = {
                Nombre,
                Descripcion,
                Precio,
                Precio_Descuento,
                Stock,
                Imagen,
                ID_Categoria
            };

            const insertarSQL = 'INSERT INTO producto SET ?';
            db.query(insertarSQL, nuevoProducto, (err, resultado) => {
                if (err) {
                    console.error('❌ Error al insertar producto:', err);
                    return res.status(500).send('Error al agregar el producto');
                }

                console.log('✅ Producto insertado correctamente');
                res.redirect('/admin');
            });
        }
    });
};

/** =========================
 *  MOSTRAR PRODUCTOS EN /admin 
 *  ========================= */
exports.mostrarProductosAdmin = (req, res) => {
    const buscar = req.query.buscar || '';
    let query = "SELECT * FROM Producto";
    let valores = [];

    if (buscar) {
        query += " WHERE Nombre LIKE ?";
        valores.push(`%${buscar}%`);
    }

    const categoriasQuery = "SELECT * FROM categoria";

    db.query(query, valores, (err, productos) => {
        if (err) {
            console.error('❌ Error al obtener productos:', err);
            return res.status(500).send('Error al cargar los productos');
        }

        db.query(categoriasQuery, (err, categorias) => {
            if (err) {
                console.error('❌ Error al obtener categorías:', err);
                return res.status(500).send('Error al cargar las categorías');
            }

            res.render('admin', {
                title: 'Administración - Katicell',
                productos,
                categorias,
                buscar
            });
        });
    });
};

/** =========================
 *  ELIMINAR PRODUCTO EN ADMIN
 *  ========================= */
exports.eliminarProducto = (req, res) => {
    const id = req.params.ID_Producto;
    const query = 'DELETE FROM Producto WHERE ID_Producto = ?';

    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar producto:', err);
            return res.status(500).send('Error al eliminar el producto');
        }

        console.log(`✅ Producto con ID ${id} eliminado correctamente`);
        res.redirect('/admin');
    });
};

/** =========================
 *  DETALLE DE PRODUCTO POR ID
 *  ========================= */
exports.detalleProductoVista = async (req, res) => {
    const id = req.params.id;

    try {
        const query = `
            SELECT 
                ID_Producto, 
                Nombre, 
                Descripcion, 
                Precio, 
                Precio_Descuento, 
                Imagen, 
                Stock 
            FROM Producto 
            WHERE ID_Producto = ?`;

            const producto = await new Promise((resolve, reject) => {
                db.query(query, [id], (err, results) => {
                    if (err) return reject(err);
                    if (results.length === 0) return reject("Producto no encontrado");
                    resolve(results[0]);
            });
        });

        res.render("detalle-prod", { producto });

    } catch (error) {
        console.error("❌ Error al obtener producto:", error);
        res.status(500).send("Producto no disponible");

    }
};

/** =========================
 *  MOSTRAR PRODUCTOS EN LA PÁGINA DE INICIO
 *  ========================= */
exports.mostrarProductosHome = (req, res) => {
    const buscar = req.query.buscar || "";
    const categoriaSeleccionada = req.query.categoria || "";
    const pagina = parseInt(req.query.page) || 1;
    const productosPorPagina = 9;
    const offset = (pagina - 1) * productosPorPagina;
    const valores = [];

    let baseQuery = `
        FROM Producto 
        JOIN Categoria ON Producto.ID_Categoria = Categoria.ID_Categoria
    `;

    const condiciones = [];

    if (buscar.trim() !== "") {
        condiciones.push("Producto.Nombre LIKE ?");
        valores.push(`%${buscar}%`);
    }

    if (categoriaSeleccionada) {
        condiciones.push("Producto.ID_Categoria = ?");
        valores.push(categoriaSeleccionada);
    }

    // Armamos condiciones si hay filtros
    const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";

    const queryProductos = `
        SELECT Producto.*, Categoria.Nombre_Categoria 
        ${baseQuery} 
        ${whereClause}
        ORDER BY Producto.ID_Producto DESC 
        LIMIT ? OFFSET ?
    `;

    const queryTotal = `
        SELECT COUNT(*) AS total 
        ${baseQuery} 
        ${whereClause}
    `;

    exports.reporteCompra = (req, res) => {
  const idPedido = req.query.id;

  if (!idPedido) {
    return res.status(400).send('Falta el ID del pedido');
  }

  // Consulta principal: obtener datos del pedido, usuario y detalles
  const sql = `
    SELECT 
      p.ID_Pedido, p.Fecha, p.Total,
      u.Nombre, u.Email, u.Direccion, u.Telefono, u.MetodoPago,
      dp.Cantidad, dp.PrecioUnitario,
      pr.Nombre AS NombreProducto
    FROM pedido p
    JOIN usuario u ON p.ID_Usuario = u.ID_Usuario
    JOIN detalle_pedido dp ON p.ID_Pedido = dp.ID_Pedido
    JOIN producto pr ON dp.ID_Producto = pr.ID_Producto
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

    // Extraemos datos generales del pedido y usuario del primer registro
    const pedido = {
      ID_Pedido: resultados[0].ID_Pedido,
      Fecha: resultados[0].Fecha,
      Total: resultados[0].Total,
    };

    const usuario = {
      Nombre: resultados[0].Nombre,
      Email: resultados[0].Email,
      Direccion: resultados[0].Direccion,
      Telefono: resultados[0].Telefono,
      MetodoPago: resultados[0].MetodoPago,
    };

    // Construimos el array de detalles
    const detalles = resultados.map(row => ({
      NombreProducto: row.NombreProducto,
      Cantidad: row.Cantidad,
      PrecioUnitario: row.PrecioUnitario,
    }));

    res.render('reporte-compra', { pedido, usuario, detalles });
  });
};

    // Agregamos LIMIT y OFFSET al final de los valores
    const valoresProductos = [...valores, productosPorPagina, offset];

    const categoriasQuery = "SELECT * FROM Categoria";


    db.query(queryTotal, valores, (err, totalResult) => {
        if (err) {
            console.error('❌ Error al contar productos:', err.message);
            return res.status(500).send('Error al contar los productos');
        }

        const totalProductos = totalResult[0].total;
        const totalPaginas = Math.ceil(totalProductos / productosPorPagina);

        db.query(queryProductos, valoresProductos, (err, productos) => {
            if (err) {
                console.error('❌ Error al obtener productos para home:', err.message);
                return res.status(500).send('Error al cargar los productos');
            }


            db.query(categoriasQuery, (err, categorias) => {
                if (err) {
                    console.error('❌ Error al obtener categorías:', err.message);
                    return res.status(500).send('Error al cargar las categorías');
                }

                res.render('home', {
                    title: 'Katicell | Inicio',
                    productos,
                    categorias,
                    buscar,
                    categoriaSeleccionada,
                    usuario: req.session.usuario || null,
                    pagina,
                    totalPaginas
                });
            });
        });
    });
};
