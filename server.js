const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs'); 
const app = express();
const PORT = 3000;

// Archivos de datos
const EVENTS_FILE = path.join(__dirname, 'events.json');
const USERS_FILE = path.join(__dirname, 'users.json');
const CONTENT_FILE = path.join(__dirname, 'content.json');

app.use(express.static('public'));
app.use(express.json());

// --- 1. AUTENTICACIÓN (LOGIN) ---
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const usersData = await fs.readFile(USERS_FILE, 'utf-8');
        const users = JSON.parse(usersData);

        const user = users.find(u => u.username === username);
        if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) return res.status(401).json({ error: 'Contraseña incorrecta' });

        res.json({ success: true, role: user.role, username: user.username });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

// --- 2. GESTIÓN DE USUARIOS (NUEVO CRUD) ---
// Obtener usuarios (sin contraseñas)
app.get('/api/users', async (req, res) => {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf-8');
        const users = JSON.parse(data);
        // Devolvemos solo lo necesario, no el hash por seguridad visual
        const safeUsers = users.map(u => ({ username: u.username, role: u.role }));
        res.json(safeUsers);
    } catch (error) { res.json([]); }
});

// Crear usuario
app.post('/api/users', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        if(!username || !password || !role) return res.status(400).json({error: 'Faltan datos'});

        const data = await fs.readFile(USERS_FILE, 'utf-8');
        const users = JSON.parse(data);

        if(users.find(u => u.username === username)) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        users.push({ username, passwordHash, role });

        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: 'Error al crear usuario' }); }
});

// Eliminar usuario
app.delete('/api/users/:username', async (req, res) => {
    try {
        const usernameToDelete = req.params.username;
        const data = await fs.readFile(USERS_FILE, 'utf-8');
        let users = JSON.parse(data);

        // Evitar que se borren todos los usuarios (seguridad básica)
        if(users.length <= 1) return res.status(400).json({error: 'No puedes borrar el último usuario'});

        const newUsers = users.filter(u => u.username !== usernameToDelete);
        await fs.writeFile(USERS_FILE, JSON.stringify(newUsers, null, 2));
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: 'Error al eliminar' }); }
});


// --- 3. GESTIÓN DE CONTENIDO ---
app.get('/api/content', async (req, res) => {
    try {
        const data = await fs.readFile(CONTENT_FILE, 'utf-8');
        res.json(JSON.parse(data));
    } catch (error) { res.json({}); }
});

app.post('/api/content', async (req, res) => {
    try {
        await fs.writeFile(CONTENT_FILE, JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: 'Error al guardar contenido' }); }
});

// --- 4. GESTIÓN DE EVENTOS ---
app.get('/api/events', async (req, res) => {
    console.log('[GET] /api/events - query:', req.query);
    try {
        const data = await fs.readFile(EVENTS_FILE, 'utf-8');
        const events = JSON.parse(data);
        console.log('[GET] /api/events - loaded events count:', Array.isArray(events) ? events.length : 0);
        res.json(events);
    } catch (error) {
        console.error('[GET] /api/events - error reading file:', error);
        res.json([]);
    }
});

app.post('/api/events', async (req, res) => {
    console.log('[POST] /api/events - body:', req.body);
    try {
        const newEvent = { id: Date.now(), ...req.body };
        let data = [];
        try {
            const file = await fs.readFile(EVENTS_FILE, 'utf-8');
            data = JSON.parse(file);
            console.log('[POST] /api/events - existing count before:', Array.isArray(data) ? data.length : 0);
        } catch (e) {
            console.warn('[POST] /api/events - file missing/empty, creating new. err:', e.message);
        }
        data.push(newEvent);
        await fs.writeFile(EVENTS_FILE, JSON.stringify(data, null, 2));
        console.log('[POST] /api/events - saved event id:', newEvent.id);
        res.status(201).json(newEvent);
    } catch (error) {
        console.error('[POST] /api/events - error saving:', error);
        res.status(500).json({ error: 'Error al guardar' });
    }
});

app.delete('/api/events/:id', async (req, res) => {
    console.log('[DELETE] /api/events/:id - params:', req.params);
    try {
        const idToDelete = parseInt(req.params.id, 10);
        const file = await fs.readFile(EVENTS_FILE, 'utf-8');
        let data = JSON.parse(file);
        console.log('[DELETE] /api/events - existing count before:', Array.isArray(data) ? data.length : 0);
        const newData = data.filter(e => e.id !== idToDelete);
        console.log('[DELETE] /api/events - new count after:', Array.isArray(newData) ? newData.length : 0);
        await fs.writeFile(EVENTS_FILE, JSON.stringify(newData, null, 2));
        console.log('[DELETE] /api/events - deleted id:', idToDelete);
        res.json({ success: true });
    } catch (error) {
        console.error('[DELETE] /api/events - error deleting:', error);
        res.status(500).json({ error: 'Error al eliminar' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor Tobalaba corriendo en http://localhost:${PORT}`);
});