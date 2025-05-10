// Función para abrir el modal
function abrirModal() {
    document.getElementById("modalAgregarProducto").style.display = "block";
  }
  
  // Función para cerrar el modal
  function cerrarModal() {
    document.getElementById("modalAgregarProducto").style.display = "none";
  }
  
  // Cerrar haciendo clic fuera del contenido del modal
  window.onclick = function (event) {
    const modal = document.getElementById("modalAgregarProducto");
    if (event.target === modal) {
      cerrarModal();
    }
  }
  