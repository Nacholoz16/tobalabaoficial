document.addEventListener('DOMContentLoaded', () => {
    
    // --- ESTADO GLOBAL ---
    let currentContent = {}; 
    let editingKey = null; 
    window.isAdmin = false;
    let currentUserRole = '';

    // Elementos DOM
    const loginModal = document.getElementById('login-modal');
    const editModal = document.getElementById('edit-modal');
    const adminPanel = document.getElementById('admin-panel');
    const usersModal = document.getElementById('users-modal');

    // --- 1. INICIALIZACIÓN ---
    init();

async function init() {
        await loadContent(); 
        loadEvents();        
        setupMenu();         
        setupNavigation();   
        setupLogin();        
        setupUsersManager();
        startHeroCarousel(); // <--- AGREGAR ESTA LÍNEA
    }

    function startHeroCarousel() {
        const slides = document.querySelectorAll('.carousel-slide');
        if (slides.length === 0) return;

        let currentSlide = 0;
        const intervalTime = 5000; // Cambia cada 5 segundos

        setInterval(() => {
            // Ocultar slide actual
            slides[currentSlide].classList.remove('opacity-100');
            slides[currentSlide].classList.add('opacity-0');

            // Calcular siguiente índice
            currentSlide = (currentSlide + 1) % slides.length;

            // Mostrar siguiente slide
            slides[currentSlide].classList.remove('opacity-0');
            slides[currentSlide].classList.add('opacity-100');
        }, intervalTime);
    }

    // --- 2. GESTIÓN DE USUARIOS (NUEVO) ---
    function setupUsersManager() {
        const openBtn = document.getElementById('open-users-btn');
        const closeBtn = document.getElementById('close-users-modal');
        const createBtn = document.getElementById('create-user-btn');

        if(openBtn) openBtn.addEventListener('click', () => {
            loadUsersList();
            usersModal.classList.remove('hidden');
        });

        if(closeBtn) closeBtn.addEventListener('click', () => {
            usersModal.classList.add('hidden');
        });

        if(createBtn) createBtn.addEventListener('click', createUser);
    }

    async function loadUsersList() {
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">Cargando...</td></tr>';

        try {
            const res = await fetch('/api/users');
            const users = await res.json();
            
            tbody.innerHTML = '';
            users.forEach(u => {
                const tr = document.createElement('tr');
                tr.className = "border-b border-gray-300";
                
                // Botón borrar (solo si no es uno mismo, lógica simple visual)
                const deleteBtn = `<button onclick="deleteUser('${u.username}')" class="text-red-600 font-bold hover:underline">X</button>`;
                
                tr.innerHTML = `
                    <td class="p-2 font-bold">${u.username}</td>
                    <td class="p-2 text-xs uppercase bg-gray-100">${u.role}</td>
                    <td class="p-2 text-right">${deleteBtn}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (e) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-red-500">Error cargando usuarios</td></tr>';
        }
    }

    async function createUser() {
        const name = document.getElementById('u-new-name').value;
        const pass = document.getElementById('u-new-pass').value;
        const role = document.getElementById('u-new-role').value;
        const msg = document.getElementById('user-msg');

        if(!name || !pass) {
            msg.textContent = "Faltan datos";
            msg.className = "text-xs font-bold mt-1 text-center text-red-600";
            return;
        }

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ username: name, password: pass, role: role })
            });
            const data = await res.json();

            if(data.success) {
                msg.textContent = "Usuario Creado";
                msg.className = "text-xs font-bold mt-1 text-center text-green-600";
                document.getElementById('u-new-name').value = '';
                document.getElementById('u-new-pass').value = '';
                loadUsersList();
            } else {
                msg.textContent = data.error || "Error";
                msg.className = "text-xs font-bold mt-1 text-center text-red-600";
            }
        } catch(e) { console.error(e); }
    }

    window.deleteUser = async function(username) {
        if(!confirm(`¿Borrar usuario ${username}?`)) return;
        try {
            const res = await fetch(`/api/users/${username}`, { method: 'DELETE' });
            const data = await res.json();
            if(data.success) loadUsersList();
            else alert(data.error);
        } catch(e) { alert("Error"); }
    }


    // --- 3. GESTIÓN DE CONTENIDO (Mantenido) ---
    async function loadContent() {
        try {
            const res = await fetch('/api/content');
            if(res.ok) {
                currentContent = await res.json();
                applyContent();
            }
        } catch (e) {}
    }

    function applyContent() {
        for (const [key, data] of Object.entries(currentContent)) {
            const el = document.querySelector(`[data-key="${key}"]`);
            if (el) {
                if (data.text) el.innerHTML = data.text;
                if (data.color) el.style.color = data.color;
            }
        }
    }

    function setupEditButtons() {
        document.querySelectorAll('.editable').forEach(el => {
            if (el.parentNode.querySelector('.edit-trigger')) return;
            const btn = document.createElement('button');
            btn.innerHTML = '<span class="material-symbols-outlined text-lg">edit</span>';
            btn.className = "edit-trigger absolute -top-4 -right-4 bg-yellow-400 text-black p-1 rounded-full shadow-lg hover:scale-110 transition-transform z-50 cursor-pointer border-2 border-black";
            el.style.position = 'relative'; 
            el.appendChild(btn);

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openEditModal(el.dataset.key);
            });
        });
    }

    function openEditModal(key) {
        editingKey = key;
        const data = currentContent[key] || { text: '', color: '#ffffff' };
        document.getElementById('edit-text-input').value = data.text || '';
        document.getElementById('edit-color-text').value = data.color || '#ffffff';
        document.getElementById('edit-color-picker').value = data.color || '#ffffff';
        editModal.classList.remove('hidden');
    }

    const colorPicker = document.getElementById('edit-color-picker');
    const colorText = document.getElementById('edit-color-text');
    if(colorPicker) {
        colorPicker.addEventListener('input', (e) => colorText.value = e.target.value);
        colorText.addEventListener('input', (e) => colorPicker.value = e.target.value);
    }

    document.getElementById('close-edit-modal').addEventListener('click', () => {
        editModal.classList.add('hidden');
        editingKey = null;
    });

    document.getElementById('save-content-btn').addEventListener('click', async () => {
        if (!editingKey) return;
        currentContent[editingKey] = {
            text: document.getElementById('edit-text-input').value,
            color: document.getElementById('edit-color-text').value
        };
        await fetch('/api/content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentContent)
        });
        applyContent();
        editModal.classList.add('hidden');
    });

    // --- 4. SISTEMA DE LOGIN (Mantenido) ---
    function setupLogin() {
        const trigger = document.getElementById('login-trigger');
        const closeBtn = document.getElementById('close-login');
        const loginBtn = document.getElementById('do-login');
        const logoutBtn = document.getElementById('logout-btn');

        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            if(window.isAdmin) return;
            loginModal.classList.remove('hidden');
        });

        closeBtn.addEventListener('click', () => loginModal.classList.add('hidden'));

        loginBtn.addEventListener('click', async () => {
            const user = document.getElementById('login-user').value;
            const pass = document.getElementById('login-pass').value;
            const errorMsg = document.getElementById('login-error');

            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: user, password: pass })
                });

                const data = await res.json();

                if (data.success) {
                    window.isAdmin = true;
                    currentUserRole = data.role;
                    loginModal.classList.add('hidden');
                    
                    document.getElementById('user-display').textContent = `HOLA ${data.username.toUpperCase()}`;
                    document.getElementById('user-display').classList.remove('hidden');
                    logoutBtn.classList.remove('hidden');
                    trigger.classList.add('hidden');

                    adminPanel.classList.remove('hidden');
                    setupEditButtons();
                    loadEvents(); 
                } else {
                    errorMsg.classList.remove('hidden');
                    errorMsg.textContent = data.error;
                }
            } catch (e) {
                errorMsg.textContent = "Error de conexión";
                errorMsg.classList.remove('hidden');
            }
        });

        logoutBtn.addEventListener('click', () => window.location.reload());
    }

    // --- 5. GESTIÓN DE EVENTOS (Mantenido) ---
    async function loadEvents() {
        const eventsGrid = document.getElementById('events-grid');
        try {
            const res = await fetch('/api/events');
            if(!res.ok) throw new Error();
            const events = await res.json();
            renderEvents(events, eventsGrid);
        } catch (error) {}
    }

function renderEvents(events, container) {
    if (!container) return;

    container.innerHTML = '';

    if (!Array.isArray(events) || events.length === 0) {
        container.innerHTML = `<div class="text-center border-4 border-white p-8"><p class="font-bold text-xl uppercase tracking-widest">Próximamente</p></div>`;
        return;
    }

    events.forEach(evt => {
        const card = document.createElement('div');
        card.className = "bg-white text-[#1a1b31] p-6 flex flex-col md:flex-row justify-between items-center group hover:bg-[#1350c2] hover:text-white transition-colors duration-300 cursor-default mb-4";

        let deleteBtnHTML = '';
        if (window.isAdmin) {
            deleteBtnHTML = `<button onclick="window.deleteEvent(${evt.id})" class="text-xs bg-red-600 text-white px-2 py-1 uppercase font-bold ml-4 hover:bg-red-800 border border-black">X Borrar</button>`;
        }

        // --- Fecha segura ---
        const d = new Date(evt.date);
        let formattedDate;
        if (isNaN(d)) {
            formattedDate = evt.date || '';
        } else {
            const day = String(d.getDate()).padStart(2, '0');
            const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
            formattedDate = `${day} ${months[d.getMonth()]}`;
        }

        // --- Normalización de campos ---
        const link = (evt.link || '').trim();


        const isGratuito = Boolean(
            evt.gratuito === true
        );

        // --- Acción ---
        let actionHTML = '';

        if (link) {
            actionHTML = `<a href="${link}" target="_blank" class="border-2 border-[#1a1b31] group-hover:border-white px-6 py-2 font-bold uppercase text-sm tracking-widest transition-colors">Tickets</a>`;
        } else if (isGratuito) {
            actionHTML = `<div class="border-2 border-green-600 group-hover:border-white px-6 py-2 font-bold uppercase text-sm tracking-widest transition-colors">GRATUITO</div>`;
        }

        card.innerHTML = `
          <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 w-full text-center md:text-left">
            <div class="font-black text-3xl md:text-4xl uppercase tracking-tighter w-full md:w-32 leading-none">
              ${formattedDate}
            </div>
            <div class="flex-grow border-l-0 md:border-l-4 border-[#1a1b31] group-hover:border-white md:pl-6 transition-colors">
              <h3 class="font-black text-2xl uppercase tracking-wide leading-none mb-1">${evt.venue || ''}</h3>
              <p class="font-mono text-sm font-bold uppercase opacity-70">${evt.details || ''}</p>
            </div>
            <div class="mt-4 md:mt-0 flex items-center space-x-2">
              ${actionHTML}
              ${deleteBtnHTML}
            </div>
          </div>
        `;

        container.appendChild(card);
    });
}

    window.addEvent = async function() {
        const date = document.getElementById('new-date').value;
        const venue = document.getElementById('new-venue').value;
        const details = document.getElementById('new-details').value;
        const link = document.getElementById('new-link').value;
        const gratuito = document.getElementById('new-gratuito').checked;

        console.log(date, venue, details, link, gratuito);
        if (!date || !venue || !details) return;
        await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date, venue, details, link, gratuito })
        });
        
        document.getElementById('new-date').value = '';
        document.getElementById('new-venue').value = '';
        document.getElementById('new-details').value = '';
        document.getElementById('new-link').value = '';
        document.getElementById('new-gratuito').checked = false;
        loadEvents();
    }

    window.deleteEvent = async function(id) {
        if(!confirm("¿BORRAR FECHA?")) return;
        await fetch(`/api/events/${id}`, { method: 'DELETE' });
        loadEvents();
    }

    // --- 6. NAVEGACIÓN Y MENÚ (Mantenido) ---
    function setupMenu() {
        const menuBtn = document.getElementById('menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const closeMenu = document.getElementById('close-menu');
        function toggleMenu(forceClose = false) {
            if (!mobileMenu) return;
            if (forceClose) mobileMenu.classList.add('hidden');
            else mobileMenu.classList.toggle('hidden');
        }
        if(menuBtn) menuBtn.addEventListener('click', () => toggleMenu());
        if(closeMenu) closeMenu.addEventListener('click', () => toggleMenu());
    }

    function setupNavigation() {
        const navLinks = document.querySelectorAll('nav a, .menu-link');
        const sections = document.querySelectorAll('section');
        const mobileMenu = document.getElementById('mobile-menu');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href');
                if (targetId && targetId.startsWith('#')) {
                    e.preventDefault();
                    if(mobileMenu) mobileMenu.classList.add('hidden');
                    let targetIndex = -1;
                    sections.forEach((section, index) => {
                        if ('#' + section.id === targetId) targetIndex = index;
                    });
                    if (targetIndex !== -1) {
                        const scrollPosition = targetIndex * window.innerHeight;
                        window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
                    } else if (targetId === '#') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                }
            });
        });
    }
});