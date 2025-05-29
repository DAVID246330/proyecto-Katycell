// carrito.js

// 👉 Obtener el ID de usuario desde localStorage (o usar 'anonimo' si no hay sesión)
const idUsuario = localStorage.getItem("idUsuario") || "anonimo";

// 👉 Clave personalizada por usuario para el carrito en localStorage
const claveCarrito = `carrito_${idUsuario}`;

// 🛒 Inicializar carrito desde localStorage
let carrito = [];
try {
    const carritoGuardado = localStorage.getItem(claveCarrito);
    if (carritoGuardado) {
        carrito = JSON.parse(carritoGuardado);
    }
} catch (e) {
    console.error("❌ Error al cargar carrito desde localStorage:", e);
    carrito = [];
}

// 🧩 Agregar producto al carrito
function agregarAlCarrito(event, id, nombre, precio, imagen) {
    event.preventDefault();

    console.log('Precio recibido en agregarAlCarrito:', precio);
    const index = carrito.findIndex(p => p.id === id);

    if (index !== -1) {
        carrito[index].cantidad += 1;
    } else {
        carrito.push({
            id,
            nombre,
            precio: parseFloat(precio),
            imagen,
            cantidad: 1
        });
    }

    localStorage.setItem(claveCarrito, JSON.stringify(carrito));
    alert(`${nombre} agregado al carrito`);
    mostrarCarrito();
    actualizarContadorCarrito();
}

// 🧾 Mostrar los productos del carrito
function mostrarCarrito() {
    const cartItemsContainer = document.querySelector(".cart-items");
    const totalContainer = document.querySelector(".cart-total span");
    cartItemsContainer.innerHTML = "";

    let total = 0;

    carrito.forEach((producto, index) => {
        const subtotal = producto.precio * producto.cantidad;
        const li = document.createElement("li");
        li.className = "cart-item";
        li.innerHTML = `
            <img src="${producto.imagen}" alt="${producto.nombre}" width="50">
            <div class="item-details">
                <p class="item-name">${producto.nombre} x${producto.cantidad}</p>
                <span class="item-subtotal">Subtotal: $${subtotal.toFixed(2)}</span>
                <button class="remove-item" onclick="eliminarDelCarrito(${index})">Eliminar</button>
            </div>
        `;
        cartItemsContainer.appendChild(li);
        total += subtotal;
    });

    totalContainer.textContent = `$${total.toFixed(2)}`;
}

// ❌ Eliminar producto del carrito
function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    localStorage.setItem(claveCarrito, JSON.stringify(carrito));
    mostrarCarrito();
    actualizarContadorCarrito();
}

// 🔢 Actualizar contador visual del carrito
function actualizarContadorCarrito() {
    const contadorElement = document.getElementById("cart-item-count");
    const cantidadTotal = carrito.reduce((sum, p) => sum + p.cantidad, 0);
    contadorElement.textContent = `${cantidadTotal} artículo${cantidadTotal !== 1 ? 's' : ''} en el carrito`;
}

// 🧭 Mostrar/ocultar el carrito desplegable
function toggleCart(event) {
    event.preventDefault();
    const cartDropdown = document.getElementById("cartDropdown");
    cartDropdown.style.display = (cartDropdown.style.display === "none" || cartDropdown.style.display === "") ? "block" : "none";
    mostrarCarrito();
}

// ✅ Finalizar compra (guarda en sesión y redirige a confirmación)
function finalizarCompra() {
    if (carrito.length === 0) {
        alert("Tu carrito está vacío.");
        return;
    }

    fetch('/carrito/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ carrito })
    })
    .then(async response => {
        if (!response.ok) {
            const data = await response.json();
            if (response.status === 401 && data.error === "No autorizado.") {
                alert("Debes iniciar sesión para finalizar tu compra.");
            } else {
                alert(data.error || "Ocurrió un error guardando el carrito.");
            }
            throw new Error(data.error);
        }
        return response.json();
    })
    .then(() => {
        window.location.href = "/carrito/confirmar";
    })
    .catch(error => {
        console.error("❌ Error en finalizarCompra:", error);
    });
}
