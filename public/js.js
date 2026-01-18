document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. MENÚ FULL SCREEN ---
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeMenu = document.getElementById('close-menu');
    
    // Función para mostrar/ocultar menú
    function toggleMenu(forceClose = false) {
        if (!mobileMenu) return;
        if (forceClose) {
            mobileMenu.classList.add('hidden');
        } else {
            mobileMenu.classList.toggle('hidden');
        }
    }

    if(menuBtn) menuBtn.addEventListener('click', () => toggleMenu());
    if(closeMenu) closeMenu.addEventListener('click', () => toggleMenu());

    // --- 2. NAVEGACIÓN "STICKY" CORREGIDA (CÁLCULO MATEMÁTICO) ---
    // Seleccionamos todos los links del menú (escritorio y móvil)
    const navLinks = document.querySelectorAll('nav a, .menu-link');
    
    // Seleccionamos todas las secciones en orden
    const sections = document.querySelectorAll('section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            
            // Si es un link interno (empieza con #)
            if (targetId && targetId.startsWith('#')) {
                e.preventDefault(); // Evitamos el comportamiento estándar fallido
                toggleMenu(true);   // Cerramos menú móvil si está abierto

                // Buscamos a qué sección corresponde ese ID
                let targetIndex = -1;
                sections.forEach((section, index) => {
                    if ('#' + section.id === targetId) {
                        targetIndex = index;
                    }
                });

                if (targetIndex !== -1) {
                    // CÁLCULO MAGISTRAL:
                    // Multiplicamos el índice por el alto de la ventana.
                    // Ejemplo: Si vamos a la sección 2 (Bio), scrolleamos a 1 * AltoPantalla.
                    const scrollPosition = targetIndex * window.innerHeight;

                    window.scrollTo({
                        top: scrollPosition,
                        behavior: 'smooth'
                    });
                } else if (targetId === '#') {
                    // Caso especial para botones que llevan arriba (como Spotify si tiene href="#")
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }
        });
    });


    // --- 3. DATOS Y RENDERIZADO (BACKEND) ---
    // (Esta parte se mantiene igual que antes)
    const eventsGrid = document.getElementById('events-grid');
    window.isAdmin = false; 

    loadEvents();

    async function loadEvents() {
        try {
            const res = await fetch('/api/events');
            if(!res.ok) throw new Error();
            const events = await res.json();
            renderEvents(events);
        } catch (error) {
            console.log("Modo offline o error de servidor");
        }
    }

    window.renderEvents = function(events) {
        if(!eventsGrid) return;
        eventsGrid.innerHTML = '';

        if(events.length === 0) {
            eventsGrid.innerHTML = `
                <div class="text-center border-4 border-white p-8">
                    <p class="font-bold text-xl uppercase tracking-widest">Próximamente</p>
                </div>`;
            return;
        }

        events.forEach(evt => {
            const card = document.createElement('div');
            card.className = "bg-white text-[#1a1b31] p-6 flex flex-col md:flex-row justify-between items-center group hover:bg-[#1350c2] hover:text-white transition-colors duration-300 cursor-default";
            
            let deleteBtnHTML = '';
            if (window.isAdmin) {
                deleteBtnHTML = `<button onclick="deleteEvent(${evt.id})" class="text-xs bg-red-600 text-white px-2 py-1 uppercase font-bold ml-4 hover:bg-red-800">Borrar</button>`;
            }

            card.innerHTML = `
                <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 w-full text-center md:text-left">
                    <div class="font-black text-3xl md:text-4xl uppercase tracking-tighter w-full md:w-32 leading-none">
                        ${evt.date.split(' ')[0]} <br>
                        <span class="text-lg md:text-xl font-bold opacity-60">${evt.date.split(' ').slice(1).join(' ')}</span>
                    </div>
                    
                    <div class="flex-grow border-l-0 md:border-l-4 border-[#1a1b31] group-hover:border-white md:pl-6 transition-colors">
                        <h3 class="font-black text-2xl uppercase tracking-wide leading-none mb-1">${evt.venue}</h3>
                        <p class="font-mono text-sm font-bold uppercase opacity-70">${evt.details}</p>
                    </div>

                    <div class="mt-4 md:mt-0 flex items-center">
                         <span class="border-2 border-[#1a1b31] group-hover:border-white px-6 py-2 font-bold uppercase text-sm tracking-widest transition-colors">
                            Tickets
                        </span>
                        ${deleteBtnHTML}
                    </div>
                </div>
            `;
            eventsGrid.appendChild(card);
        });
    };

    // --- 4. ADMIN ---
    const adminPanel = document.getElementById('admin-panel');
    const adminTrigger = document.getElementById('admin-trigger');

    if(adminTrigger) {
        adminTrigger.addEventListener('click', (e) => {
            e.preventDefault(); // Evitamos que salte
            const password = prompt("ADMIN:");
            if (password === "tobalaba") { 
                window.isAdmin = true;
                toggleAdminPanel(true);
                loadEvents();
            }
        });
    }

    window.toggleAdminPanel = function(show) { // Renombrado para evitar conflicto con toggleMenu
        if(adminPanel) {
            if(show === true) adminPanel.classList.remove('hidden');
            else adminPanel.classList.toggle('hidden');
        }
    }
    // Exponer al window para el botón de cerrar del HTML
    window.toggleAdmin = window.toggleAdminPanel; 

    window.addEvent = async function() {
        const date = document.getElementById('new-date').value;
        const venue = document.getElementById('new-venue').value;
        const details = document.getElementById('new-details').value;

        if (!date || !venue) return;

        await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, venue, details })
        });

        document.getElementById('new-date').value = '';
        document.getElementById('new-venue').value = '';
        document.getElementById('new-details').value = '';
        loadEvents();
    }

    window.deleteEvent = async function(id) {
        if(!confirm("CONFIRMAR")) return;
        await fetch(`/api/events/${id}`, { method: 'DELETE' });
        loadEvents();
    }
});