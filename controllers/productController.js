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
        Imagen,
        ID_Categoria
    } = req.body;

    // Validar campos obligatorios
    if (!Nombre || !Descripcion || !Precio || !Stock || !Imagen || !ID_Categoria) {
        return res.status(400).send('Por favor, completa todos los campos.');
    }

    // Crear objeto con datos del formulario
    const nuevoProducto = {
        Nombre,
        Descripcion,
        Precio,
        Precio_Descuento,
        Stock,
        Imagen,
        ID_Categoria
    };

    // Consulta SQL para insertar producto
    const sql = 'INSERT INTO producto SET ?';

    db.query(sql, nuevoProducto, (err, resultado) => {
        if (err) {
            console.error('❌ Error al insertar producto:', err);
            return res.status(500).send('Error al agregar el producto');
        }

        console.log('✅ Producto insertado correctamente:', resultado);
        res.redirect('/admin');
    });
};

/** =========================
 *  MOSTRAR PRODUCTOS EN /admin CON BÚSQUEDA
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
 *  MOSTRAR PRODUCTOS EN LA PÁGINA DE INICIO
 *  ========================= */
exports.mostrarProductosHome = (req, res) => {
    const buscar = req.query.buscar || "";
    const categoriaSeleccionada = req.query.categoria || "";
    const valores = [];

    let query = `
        SELECT Producto.*, Categoria.Nombre_Categoria 
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

    if (condiciones.length > 0) {
        query += " WHERE " + condiciones.join(" AND ");
    }

    const categoriasQuery = "SELECT * FROM Categoria";

    db.query(query, valores, (err, productos) => {
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
                categoriaSeleccionada
            });
        });
    });
};

