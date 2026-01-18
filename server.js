document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. LÓGICA DE NAVEGACIÓN (MENÚ MÓVIL) ---
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if(menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // --- 2. LÓGICA DE DATOS (API & RENDERIZADO) ---
    const eventsGrid = document.getElementById('events-grid');
    
    // Variable global para saber si el usuario es admin
    window.isAdmin = false; 

    // Cargar eventos al iniciar la página
    loadEvents();

    // Función: Obtener datos del Backend
    async function loadEvents() {
        try {
            const res = await fetch('/api/events');
            if(!res.ok) throw new Error('Error al conectar con el servidor');
            const events = await res.json();
            renderEvents(events);
        } catch (error) {
            console.error(error);
            if(eventsGrid) {
                eventsGrid.innerHTML = '<p class="text-[#3b4e8b] col-span-3 text-center py-10">No se pudieron cargar las fechas. Revisa que el servidor (node server.js) esté corriendo.</p>';
            }
        }
    }

    // Función: Dibujar las tarjetas en pantalla
    // (Esta función se exporta a window para que pueda ser sobreescrita si es necesario, 
    // pero aquí ya incluye los ESTILOS NUEVOS AZULES)
    window.renderEvents = function(events) {
        if(!eventsGrid) return;
        
        eventsGrid.innerHTML = ''; // Limpiar contenido actual

        if(events.length === 0) {
            eventsGrid.innerHTML = `
                <div class="col-span-1 md:col-span-3 text-center py-10 opacity-70">
                    <p class="text-[#3a59b4] text-xl funky-font mb-2">PRONTO MÁS NOVEDADES</p>
                    <p class="text-[#3b4e8b]">No hay fechas confirmadas por el momento.</p>
                </div>
            `;
            return;
        }

        events.forEach(evt => {
            const card = document.createElement('div');
            
            // --- ESTILOS DE LA TARJETA (NUEVA PALETA) ---
            // Fondo: Azul profundo intermedio (#1f2a5c)
            // Borde: Azul apagado (#2c4186) -> Azul claro al hover (#3a59b4)
            card.className = "bg-[#1f2a5c] border border-[#2c4186] hover:border-[#3a59b4] transition duration-300 p-6 rounded-lg relative group shadow-lg flex flex-col";
            
            // Botón de eliminar (Solo visible si es Admin)
            let deleteBtnHTML = '';
            if (window.isAdmin) {
                deleteBtnHTML = `<button onclick="deleteEvent(${evt.id})" class="absolute top-2 right-2 text-red-400 hover:text-red-200 font-bold p-2 transition">✕</button>`;
            }

            card.innerHTML = `
                ${deleteBtnHTML}
                <h3 class="text-2xl font-bold text-[#3a59b4] mb-1 leading-tight">${evt.venue}</h3>
                <p class="text-[#e0e6ed] font-semibold uppercase tracking-wider text-sm mb-6 opacity-90">${evt.details}</p>
                
                <div class="mt-auto pt-4 border-t border-[#2c4186]/50 flex items-center justify-between">
                    <div class="flex items-center text-[#3b4e8b]">
                        <span class="material-symbols-outlined mr-2 text-sm">calendar_month</span>
                        <span class="font-mono text-sm">${evt.date}</span>
                    </div>
                    
                    <a href="#" class="px-4 py-1 border border-[#2c4186] rounded text-[#3b4e8b] text-xs font-bold uppercase hover:bg-[#3a59b4] hover:text-white hover:border-[#3a59b4] transition">
                        Tickets
                    </a>
                </div>
            `;
            eventsGrid.appendChild(card);
        });
    };

    // --- 3. LÓGICA DE ADMINISTRADOR ---
    const adminPanel = document.getElementById('admin-panel');
    const adminTrigger = document.getElementById('admin-trigger');

    // Activar modo Admin (Candado en el footer)
    if(adminTrigger) {
        adminTrigger.addEventListener('click', () => {
            if(window.isAdmin) {
                // Si ya es admin, solo abrimos el panel
                toggleAdmin(true);
            } else {
                // Si no, pedimos clave
                const password = prompt("Seguridad Tobalaba:");
                if (password === "tobalaba") { 
                    window.isAdmin = true;
                    toggleAdmin(true);
                    loadEvents(); // Recargar para que aparezcan las "X" de borrar
                    alert("Modo Editor Activado");
                } else if(password !== null) {
                    alert("Acceso denegado");
                }
            }
        });
    }

    // Función global para Abrir/Cerrar panel desde el botón "Cerrar" del HTML
    window.toggleAdmin = function(show) {
        if(adminPanel) {
            if(show === true) {
                adminPanel.classList.remove('hidden');
            } else if (show === false) {
                adminPanel.classList.add('hidden');
            } else {
                // Toggle automático si no se pasa parámetro
                adminPanel.classList.toggle('hidden');
            }
        }
    }

    // --- 4. ACCIONES CRUD (Crear / Borrar) ---

    // Agregar Evento (POST)
    window.addEvent = async function() {
        const dateInput = document.getElementById('new-date');
        const venueInput = document.getElementById('new-venue');
        const detailsInput = document.getElementById('new-details');

        const date = dateInput.value.trim();
        const venue = venueInput.value.trim();
        const details = detailsInput.value.trim();

        if (!date || !venue) {
            alert("Por favor completa al menos la Fecha y la Ciudad.");
            return;
        }

        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, venue, details })
            });

            if(res.ok) {
                // Limpiar inputs
                dateInput.value = '';
                venueInput.value = '';
                detailsInput.value = '';
                // Recargar lista
                loadEvents();
            } else {
                alert("Error al guardar en el servidor.");
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión.");
        }
    }

    // Eliminar Evento (DELETE)
    window.deleteEvent = async function(id) {
        if(!confirm("¿Seguro que quieres eliminar esta fecha?")) return;

        try {
            const res = await fetch(`/api/events/${id}`, {
                method: 'DELETE'
            });
            
            if(res.ok) {
                loadEvents();
            } else {
                alert("No se pudo eliminar.");
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión al eliminar.");
        }
    }

});