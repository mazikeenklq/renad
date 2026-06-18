// ===== VARIABLES GLOBALES =====
let formRegistro;
let modalExito;
let closeModal;
let btnNuevoRegistro;
let listaMascotas;
let mensajeVacio;
let mascotasEnMemoria = [];
const STORAGE_KEY = 'renadMascotas';

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar variables del DOM
    formRegistro = document.getElementById('formRegistro');
    modalExito = document.getElementById('modalExito');
    closeModal = document.getElementById('closeModal');
    btnNuevoRegistro = document.getElementById('btnNuevoRegistro');
    listaMascotas = document.getElementById('listaMascotas');
    mensajeVacio = document.getElementById('mensajeVacio');
    
    console.log('✓ DOM cargado');
    console.log('✓ formRegistro:', formRegistro);
    console.log('✓ modalExito:', modalExito);
    console.log('✓ listaMascotas:', listaMascotas);
    inicializarAplicacion();
});

function inicializarAplicacion() {
    cargarMascotasDesdeLocalStorage();
    cargarMascotas();
    agregarEventListeners();
}


// ===== EVENT LISTENERS =====
function agregarEventListeners() {
    // Formulario
    formRegistro.addEventListener('submit', manejarRegistro);
    
    // Modal
    closeModal.addEventListener('click', cerrarModal);
    btnNuevoRegistro.addEventListener('click', nuevoRegistro);
    
    // Cerrar modal al hacer click fuera
    window.addEventListener('click', function(event) {
        if (event.target === modalExito) {
            cerrarModal();
        }
    });
    
    // Navegación suave
    document.querySelectorAll('a[href^="#"]').forEach(enlace => {
        enlace.addEventListener('click', manejarNavegacion);
    });
    
    // Validación en tiempo real
    formRegistro.querySelectorAll('input, select, textarea').forEach(campo => {
        campo.addEventListener('blur', validarCampo);
        campo.addEventListener('input', limpiarErrorCampo);
    });
}

// ===== VALIDACIÓN DE FORMULARIO =====
function manejarRegistro(event) {
    event.preventDefault();
    console.log('✓ manejarRegistro ejecutándose');
    
    // Limpiar errores anteriores
    limpiarTodosLosErrores();
    
    // Validar todos los campos
    if (!validarFormulario()) {
        console.log('✗ Validación fallida');
        return;
    }
    
    console.log('✓ Validación pasada');
    
    try {
        const datosRegistro = obtenerDatosFormulario();
        console.log('✓ Datos obtenidos:', datosRegistro);
        
        guardarMascota(datosRegistro);
        console.log('✓ Mascota registrada en memoria');
        
        mostrarModalExito(datosRegistro);
        console.log('✓ Modal mostrado');
        
        cargarMascotas();
    } catch (error) {
        console.error('✗ Error al registrar mascota:', error.message);
        if (error.message.includes('sexo')) {
            mostrarError('sexoMascota', error.message);
        } else {
            mostrarMensajeConfirmacion('Error al guardar el registro. Intente de nuevo.', 'error');
        }
    }
}

function validarFormulario() {
    const campos = {
        nombreMascota: { 
            validar: (v) => v.trim().length > 0, 
            error: 'El nombre de la mascota es requerido' 
        },
        edadMascota: { 
            validar: (v) => v > 0 && v <= 120, 
            error: 'Ingresa una edad válida (0-120 años)' 
        },
        especieMascota: { 
            validar: (v) => v.length > 0, 
            error: 'Selecciona una especie' 
        },
        colorMascota: { 
            validar: (v) => v.trim().length > 0, 
            error: 'Describe el color o características' 
        },
        razaMascota: { 
            validar: (v) => v.trim().length > 0, 
            error: 'La raza es requerida' 
        },
        fechaMascota: { 
            validar: (v) => {
                if (!v) return false;
                const fecha = new Date(v);
                const hoy = new Date();
                return fecha < hoy;
            }, 
            error: 'Ingresa una fecha válida' 
        },
        sexoMascota: { 
            validar: (v) => {
                const radios = document.querySelectorAll('input[name="sexoMascota"]');
                return Array.from(radios).some(r => r.checked);
            }, 
            error: 'Selecciona un sexo' 
        },
        cedula: { 
            validar: (v) => /^\d{6,12}$/.test(v.trim()), 
            error: 'Ingresa una cédula válida (6-12 dígitos)' 
        },
        nombreResponsable: { 
            validar: (v) => v.trim().length > 0, 
            error: 'El nombre es requerido' 
        },
        apellidoResponsable: { 
            validar: (v) => v.trim().length > 0, 
            error: 'El apellido es requerido' 
        },
        telefonoResponsable: { 
            validar: (v) => /^\d{7,15}$/.test(v.trim()), 
            error: 'Ingresa un teléfono válido' 
        },
        emailResponsable: { 
            validar: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), 
            error: 'Ingresa un email válido' 
        },
        direccion: { 
            validar: (v) => v.trim().length > 5, 
            error: 'Ingresa una dirección válida' 
        },
        ciudadResponsable: { 
            validar: (v) => v.trim().length > 0, 
            error: 'La ciudad es requerida' 
        },
        codigoPostal: { 
            validar: (v) => v.trim().length > 0, 
            error: 'El código postal es requerido' 
        }
    };
    
    let esValido = true;
    
    for (const [campoId, regla] of Object.entries(campos)) {
        let valor;
        
        if (campoId === 'sexoMascota') {
            const radios = document.querySelectorAll('input[name="sexoMascota"]');
            valor = Array.from(radios).some(r => r.checked);
        } else {
            const campo = document.getElementById(campoId);
            if (!campo) {
                console.warn(`Campo no encontrado: ${campoId}`);
                valor = '';
            } else {
                valor = campo.value;
            }
        }
        
        if (!regla.validar(valor)) {
            mostrarError(campoId, regla.error);
            esValido = false;
        }
    }
    
    return esValido;
}

function validarCampo(event) {
    const campo = event.target;
    const id = campo.id;
    
    // Mapeo de validaciones
    const validaciones = {
        nombreMascota: (v) => v.trim().length > 0,
        edadMascota: (v) => v > 0 && v <= 120,
        especieMascota: (v) => v.length > 0,
        colorMascota: (v) => v.trim().length > 0,
        razaMascota: (v) => v.trim().length > 0,
        fechaMascota: (v) => {
            if (!v) return false;
            const fecha = new Date(v);
            const hoy = new Date();
            return fecha < hoy;
        },
        cedula: (v) => /^\d{6,12}$/.test(v.trim()),
        nombreResponsable: (v) => v.trim().length > 0,
        apellidoResponsable: (v) => v.trim().length > 0,
        telefonoResponsable: (v) => /^\d{7,15}$/.test(v.trim()),
        emailResponsable: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
        direccion: (v) => v.trim().length > 5,
        ciudadResponsable: (v) => v.trim().length > 0,
        codigoPostal: (v) => v.trim().length > 0
    };
    
    if (id in validaciones && !validaciones[id](campo.value)) {
        campo.classList.add('error');
    }
}

function limpiarErrorCampo(event) {
    const campo = event.target;
    const errorId = 'error' + campo.id.charAt(0).toUpperCase() + campo.id.slice(1);
    const errorElement = document.getElementById(errorId);
    
    campo.classList.remove('error');
    if (errorElement) {
        errorElement.classList.remove('show');
    }
}

function mostrarError(campoId, mensaje) {
    const campo = document.getElementById(campoId);
    const errorElement = document.getElementById('error' + campoId.charAt(0).toUpperCase() + campoId.slice(1));
    
    if (campo) {
        campo.classList.add('error');
    }
    
    if (errorElement) {
        errorElement.textContent = mensaje;
        errorElement.classList.add('show');
    }
}

function limpiarTodosLosErrores() {
    document.querySelectorAll('.error-message').forEach(elem => {
        elem.classList.remove('show');
    });
    
    document.querySelectorAll('.error').forEach(elem => {
        elem.classList.remove('error');
    });
}

// ===== OBTENER DATOS DEL FORMULARIO =====
function obtenerDatosFormulario() {
    const sexoRadio = document.querySelector('input[name="sexoMascota"]:checked');
    const sexo = sexoRadio ? sexoRadio.value : null;
    
    if (!sexo) {
        throw new Error('Debe seleccionar un sexo para la mascota');
    }
    
    return {
        id: Date.now(),
        nombreMascota: document.getElementById('nombreMascota').value,
        edadMascota: document.getElementById('edadMascota').value,
        especieMascota: document.getElementById('especieMascota').value,
        colorMascota: document.getElementById('colorMascota').value,
        razaMascota: document.getElementById('razaMascota').value,
        microchipMascota: document.getElementById('microchipMascota').value,
        fechaMascota: document.getElementById('fechaMascota').value,
        sexoMascota: sexo,
        cedula: document.getElementById('cedula').value,
        nombreResponsable: document.getElementById('nombreResponsable').value,
        apellidoResponsable: document.getElementById('apellidoResponsable').value,
        telefonoResponsable: document.getElementById('telefonoResponsable').value,
        emailResponsable: document.getElementById('emailResponsable').value,
        direccion: document.getElementById('direccion').value,
        ciudadResponsable: document.getElementById('ciudadResponsable').value,
        codigoPostal: document.getElementById('codigoPostal').value,
        fechaRegistro: new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    };
}

// ===== ALMACENAMIENTO EN ARCHIVO =====
function guardarMascota(datos) {
    console.log('guardarMascota en memoria - datos recibidos:', datos);
    mascotasEnMemoria.push(datos);
    guardarMascotasEnLocalStorage();
}

function obtenerMascotas() {
    console.log('obtenerMascotas en memoria:', mascotasEnMemoria);
    return mascotasEnMemoria;
}

function eliminarMascota(id) {
    mascotasEnMemoria = mascotasEnMemoria.filter(m => m.id !== id);
    guardarMascotasEnLocalStorage();
    cargarMascotas();
}

function guardarMascotasEnLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mascotasEnMemoria));
}

function cargarMascotasDesdeLocalStorage() {
    const datos = localStorage.getItem(STORAGE_KEY);
    if (!datos) {
        mascotasEnMemoria = [];
        return;
    }

    try {
        mascotasEnMemoria = JSON.parse(datos) || [];
    } catch (error) {
        console.error('Error cargando mascotas desde localStorage:', error);
        mascotasEnMemoria = [];
    }
}

// ===== MOSTRAR MASCOTAS =====
function cargarMascotas() {
    console.log('cargarMascotas ejecutándose...');
    console.log('listaMascotas:', listaMascotas);
    
    if (!listaMascotas) {
        console.error('ERROR: listaMascotas no está inicializado');
        return;
    }
    
    const mascotas = obtenerMascotas();
    console.log('mascotas a mostrar:', mascotas);
    listaMascotas.innerHTML = '';
    
    if (mascotas.length === 0) {
        console.log('No hay mascotas, mostrando mensaje vacío');
        mostrarMensajeVacio();
        return;
    }
    
    console.log('Mostrando', mascotas.length, 'mascotas');
    ocultarMensajeVacio();
    
    mascotas.forEach(mascota => {
        const card = crearTarjetaMascota(mascota);
        if (card) {
            listaMascotas.appendChild(card);
        }
    });
}

function crearTarjetaMascota(mascota) {
    try {
        const card = document.createElement('div');
        card.className = 'mascota-card';
        card.innerHTML = `
        <div class="mascota-card-header">
            <h3>${mascota.nombreMascota}</h3>
            <p>${mascota.especieMascota} - ${mascota.razaMascota}</p>
        </div>
        <div class="mascota-card-body">
            <div class="mascota-detail">
                <label>Edad:</label>
                <span>${mascota.edadMascota} años</span>
            </div>
            <div class="mascota-detail">
                <label>Sexo:</label>
                <span>${mascota.sexoMascota}</span>
            </div>
            <div class="mascota-detail">
                <label>Color:</label>
                <span>${mascota.colorMascota}</span>
            </div>
            <div class="mascota-detail">
                <label>Fecha Nacimiento:</label>
                <span>${mascota.fechaMascota}</span>
            </div>
            ${mascota.microchipMascota ? `
                <div class="mascota-detail">
                    <label>Microchip:</label>
                    <span>${mascota.microchipMascota}</span>
                </div>
            ` : ''}
            <div class="mascota-detail">
                <label>Responsable:</label>
                <span>${mascota.nombreResponsable} ${mascota.apellidoResponsable}</span>
            </div>
            <div class="mascota-detail">
                <label>Contacto:</label>
                <span>${mascota.telefonoResponsable}</span>
            </div>
            <div class="mascota-detail">
                <label>Registrado:</label>
                <span>${mascota.fechaRegistro}</span>
            </div>
        </div>
        <div class="mascota-card-footer">
            <button class="btn btn-success btn-small" onclick="mostrarDetalles(${mascota.id})">
                Ver Detalles
            </button>
            <button class="btn btn-danger btn-small" onclick="confirmarEliminar(${mascota.id})">
                Eliminar
            </button>
        </div>
    `;
        console.log('✓ Tarjeta creada para mascota:', mascota.nombreMascota);
        return card;
    } catch (error) {
        console.error('ERROR al crear tarjeta de mascota:', error, mascota);
        return null;
    }
}

function mostrarDetalles(id) {
    const mascotas = obtenerMascotas();
    const mascota = mascotas.find(m => m.id === id);
    
    if (mascota) {
        alert(`
DETALLES COMPLETOS DE ${mascota.nombreMascota}

DATOS DE LA MASCOTA:
- Nombre: ${mascota.nombreMascota}
- Especie: ${mascota.especieMascota}
- Raza: ${mascota.razaMascota}
- Edad: ${mascota.edadMascota} años
- Sexo: ${mascota.sexoMascota}
- Color: ${mascota.colorMascota}
- Fecha de Nacimiento: ${mascota.fechaMascota}
${mascota.microchipMascota ? `- Microchip: ${mascota.microchipMascota}` : ''}

DATOS DEL RESPONSABLE LEGAL:
- Nombre: ${mascota.nombreResponsable} ${mascota.apellidoResponsable}
- Cédula: ${mascota.cedula}
- Teléfono: ${mascota.telefonoResponsable}
- Email: ${mascota.emailResponsable}
- Dirección: ${mascota.direccion}
- Ciudad: ${mascota.ciudadResponsable}
- Código Postal: ${mascota.codigoPostal}

Fecha de Registro: ${mascota.fechaRegistro}
        `);
    }
}

function confirmarEliminar(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este registro de mascota?')) {
        eliminarMascota(id);
        mostrarMensajeConfirmacion('Mascota eliminada correctamente', 'success');
    }
}

function verificarMascotasVacio() {
    const mascotas = obtenerMascotas();
    if (mascotas.length === 0) {
        mostrarMensajeVacio();
    } else {
        ocultarMensajeVacio();
    }
}

function mostrarMensajeVacio() {
    mensajeVacio.style.display = 'block';
}

function ocultarMensajeVacio() {
    mensajeVacio.style.display = 'none';
}

// ===== MODAL =====
function mostrarModalExito(datos) {
    const mensaje = document.getElementById('modalMessage');
    mensaje.textContent = `¡Registro de ${datos.nombreMascota} completado exitosamente! Los datos han sido guardados.`;
    modalExito.style.display = 'block';
}

function cerrarModal() {
    modalExito.style.display = 'none';
}

function nuevoRegistro() {
    cerrarModal();
    formRegistro.reset();
    limpiarTodosLosErrores();
    
    // Scroll a la sección de registro
    document.getElementById('registro').scrollIntoView({ behavior: 'smooth' });
}

// ===== NAVEGACIÓN SUAVE =====
function manejarNavegacion(event) {
    event.preventDefault();
    const href = event.currentTarget.getAttribute('href');
    const target = document.querySelector(href);
    
    if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        
        // Actualizar enlaces activos en la navegación
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
    }
}

// ===== FUNCIONES AUXILIARES =====
function mostrarMensajeConfirmacion(mensaje, tipo = 'info') {
    // Crear un elemento temporal para mostrar el mensaje
    const div = document.createElement('div');
    div.textContent = mensaje;
    div.style.position = 'fixed';
    div.style.bottom = '20px';
    div.style.right = '20px';
    div.style.padding = '15px 20px';
    div.style.borderRadius = '4px';
    div.style.zIndex = '9999';
    div.style.animation = 'slideIn 0.3s ease';
    
    if (tipo === 'success') {
        div.style.backgroundColor = '#10b981';
        div.style.color = 'white';
    } else if (tipo === 'error') {
        div.style.backgroundColor = '#ef4444';
        div.style.color = 'white';
    }
    
    document.body.appendChild(div);
    
    setTimeout(() => {
        div.remove();
    }, 3000);
}

// ===== DATOS DE EJEMPLO (OPCIONAL) =====
function cargarDatosEjemplo() {
    const datosEjemplo = [
        {
            id: 1,
            nombreMascota: 'Max',
            edadMascota: 3,
            especieMascota: 'Perro',
            colorMascota: 'Café con blanco',
            razaMascota: 'Golden Retriever',
            microchipMascota: 'ML123456789',
            fechaMascota: '2021-05-15',
            sexoMascota: 'Macho',
            cedula: '12345678',
            nombreResponsable: 'Juan',
            apellidoResponsable: 'Pérez',
            telefonoResponsable: '5551234567',
            emailResponsable: 'juan@example.com',
            direccion: 'Calle Principal 123',
            ciudadResponsable: 'Madrid',
            codigoPostal: '28001',
            fechaRegistro: new Date().toLocaleDateString('es-ES')
        }
    ];
    for (const mascota of datosEjemplo) {
        guardarMascota(mascota);
    }
    cargarMascotas();
}

// Descomenta esta línea para cargar datos de ejemplo al iniciar
// cargarDatosEjemplo();
