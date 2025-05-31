const db = require('../models/db');

// Guarda el carrito en sesión
exports.guardarCarritoEnSesion = (req, res) => {
    if (!req.session.usuario) {
        console.log('⚠️ Intento de guardar carrito sin sesión iniciada.');
        return res.status(401).json({ error: 'Debes iniciar sesión para guardar el carrito.' });
    }

    console.log('🛒 Carrito recibido del cliente:', req.body.carrito);

    req.session.carrito = req.body.carrito || [];

    console.log('✅ Carrito guardado en la sesión:', req.session.carrito);

    res.json({ mensaje: '🛒 Carrito guardado en la sesión correctamente.' });
};

// Muestra la vista de confirmación
exports.mostrarConfirmacionCompra = (req, res) => {
    const usuario = req.session.usuario;
    const carrito = req.session.carrito || [];

    if (!usuario) {
        console.log('⚠️ Usuario no autenticado al intentar acceder a la confirmación de compra.');
        return res.status(401).send("Debes iniciar sesión para continuar con la compra.");
    }

    console.log('👤 Usuario confirmado:', usuario);
    console.log('🛒 Carrito a confirmar:', carrito);

    res.render('confirmar-compra', { usuario, carrito });
};

// Finaliza la compra
exports.finalizarCompra = async (req, res) => {
    const idUsuario = req.session.usuario?.id_usuario;
    const nombreUsuario = req.session.usuario?.nombre;
    const { direccion = null, metodo_pago = null, productos } = req.body;

    console.log('📦 Productos recibidos para compra:', productos);
    console.log('🏠 Dirección:', direccion);
    console.log('💳 Método de pago:', metodo_pago);

    if (!idUsuario) {
        console.log('❌ Intento de compra sin sesión iniciada.');
        return res.status(401).json({ error: 'No autorizado. Inicia sesión primero.' });
    }

    if (!Array.isArray(productos) || productos.length === 0) {
        console.log('⚠️ No se recibieron productos válidos.');
        return res.status(400).json({ error: 'No hay productos válidos para procesar el pedido.' });
    }

    const total = productos.reduce((sum, p) => sum + (parseFloat(p.precio) * parseInt(p.cantidad)), 0);
    console.log('💰 Total calculado del pedido:', total);

    try {
        const pedidoResult = await db.query(
            'INSERT INTO pedido (id_usuario, fecha_pedido, estado_pedido, total) VALUES ($1, NOW(), $2, $3) RETURNING id_pedido',
            [idUsuario, 'pendiente', total]
        );

        const idPedido = pedidoResult.rows[0].id_pedido;
        console.log(`📦 Pedido #${idPedido} registrado correctamente.`);

        for (const prod of productos) {
            console.log(`➡️ Insertando detalle del producto ID: ${prod.id}`);
            await db.query(
                'INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio) VALUES ($1, $2, $3, $4)',
                [idPedido, prod.id, prod.cantidad, prod.precio]
            );
            console.log(`✅ Detalle del producto ${prod.id} insertado correctamente.`);
        }

        const metodoResult = await db.query(
            'SELECT id_metodo_pago, nombre_metodo FROM metodo_pago WHERE nombre_metodo = $1',
            [metodo_pago]
        );

        if (metodoResult.rowCount === 0) {
            console.error('❌ Método de pago no encontrado');
            return res.status(400).json({ error: 'Método de pago inválido.' });
        }

        const idMetodo = metodoResult.rows[0].id_metodo_pago;
        const nombreMetodo = metodoResult.rows[0].nombre_metodo;

        console.log(`💳 Método de pago encontrado: ${nombreMetodo} (ID: ${idMetodo})`);

        await db.query(
            'INSERT INTO pago (monto, fecha_pago, estado_pago, pedido_id_pedido, metodo_pago_id_metodo_pago) VALUES ($1, NOW(), $2, $3, $4)',
            [total, 'pendiente', idPedido, idMetodo]
        );

        if (direccion) {
            console.log(`📍 Actualizando dirección del usuario (ID: ${idUsuario}) a: ${direccion}`);
            await db.query(
                'UPDATE usuario SET direccion = $1 WHERE id_usuario = $2',
                [direccion, idUsuario]
            );
        }

        // Guardar resumen en sesión para mostrar en la vista final
        req.session.carrito = [];
        req.session.nombreUsuario = nombreUsuario;
        req.session.direccion = direccion;
        req.session.metodo_pago = nombreMetodo;

        console.log('✅ Pedido finalizado correctamente.');
        return res.json({ mensaje: '✅ Pedido registrado con éxito.' });

    } catch (err) {
        console.error('❌ Error durante el proceso de compra:', err);
        return res.status(500).json({ error: 'Error al procesar el pedido.' });
    }
};

// Vista final después de la compra
exports.pedidoExitoso = (req, res) => {
    const nombreUsuario = req.session.nombreUsuario || 'Cliente';
    const direccion = req.session.direccion || 'No proporcionada';
    const metodo_pago = req.session.metodo_pago || 'Desconocido';

    console.log('🎉 Mostrando resumen final de compra:');
    console.log('👤 Cliente:', nombreUsuario);
    console.log('📍 Dirección:', direccion);
    console.log('💳 Método de pago:', metodo_pago);

    res.render('pedido-exitoso', { nombreUsuario, direccion, metodo_pago });
};
