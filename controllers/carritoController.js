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
exports.finalizarCompra = (req, res) => {
    const idUsuario = req.session.usuario?.ID_Usuario;
    const nombreUsuario = req.session.usuario?.Nombre;
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

    db.query(
        'INSERT INTO pedido (ID_Usuario, Fecha_Pedido, Estado_Pedido, Total) VALUES (?, NOW(), ?, ?)',
        [idUsuario, 'Pendiente', total],
        (err, pedidoResult) => {
            if (err) {
                console.error('❌ Error al registrar el pedido:', err);
                return res.status(500).json({ error: 'Ocurrió un error al registrar el pedido.' });
            }

            const idPedido = pedidoResult.insertId;
            console.log(`📦 Pedido #${idPedido} registrado correctamente.`);

            let errores = false;
            let completados = 0;

            productos.forEach(prod => {
                console.log(`➡️ Insertando detalle del producto ID: ${prod.id}`);

                db.query(
                    'INSERT INTO detalle_pedido (ID_Pedido, ID_Producto, Cantidad, Precio) VALUES (?, ?, ?, ?)',
                    [idPedido, prod.id, prod.cantidad, prod.precio],
                    (err) => {
                        if (err) {
                            console.error(`❌ Error al insertar detalle del producto ${prod.id}:`, err);
                            errores = true;
                        } else {
                            console.log(`✅ Detalle del producto ${prod.id} insertado correctamente.`);
                        }

                        completados++;
                        if (completados === productos.length) {
                            if (errores) {
                                return res.status(500).json({ error: 'El pedido fue creado, pero algunos detalles no se guardaron correctamente.' });
                            }

                            db.query(
                                'SELECT ID_metodo_pago, nombre_metodo FROM metodo_pago WHERE nombre_metodo = ?',
                                [metodo_pago],
                                (err, metodoResult) => {
                                    if (err || metodoResult.length === 0) {
                                        console.error('❌ Error al obtener el método de pago:', err || 'No encontrado');
                                        return res.status(500).json({ error: 'Método de pago inválido.' });
                                    }

                                    const idMetodo = metodoResult[0].ID_metodo_pago;
                                    const nombreMetodo = metodoResult[0].nombre_metodo;

                                    console.log(`💳 Método de pago encontrado: ${nombreMetodo} (ID: ${idMetodo})`);

                                    db.query(
                                        'INSERT INTO pago (monto, fecha_pago, estado_pago, pedido_ID_Pedido, metodo_pago_ID_metodo_pago) VALUES (?, NOW(), ?, ?, ?)',
                                        [total, 'pendiente', idPedido, idMetodo],
                                        (err) => {
                                            if (err) {
                                                console.error('❌ Error al insertar el pago:', err);
                                                return res.status(500).json({ error: 'Error al registrar el pago.' });
                                            }

                                            if (direccion) {
                                                console.log(`📍 Actualizando dirección del usuario (ID: ${idUsuario}) a: ${direccion}`);
                                                db.query(
                                                    'UPDATE usuario SET Dirección = ? WHERE ID_Usuario = ?',
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
                                        }
                                    );
                                }
                            );
                        }
                    }
                );
            });
        }
    );
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
