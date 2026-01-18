const express = require('express');
const fs = require('fs').promises; 
const path = require('path');
const app = express();
const PORT = 3000;

// Definimos dónde está el archivo de datos
const DATA_FILE = path.join(__dirname, 'events.json');

// --- MIDDLEWARE ---
// Esto hace que la carpeta 'public' sea accesible desde el navegador
app.use(express.static('public')); 
// Esto permite leer los datos JSON que envía el navegador
app.use(express.json()); 

// --- RUTAS DE LA API (El cerebro que guarda/lee datos) ---

// 1. LEER eventos (GET)
app.get('/api/events', async (req, res) => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        res.json(JSON.parse(data));
    } catch (error) {
        // Si no existe el archivo, devolvemos una lista vacía
        res.json([]); 
    }
});

// 2. GUARDAR evento (POST)
app.post('/api/events', async (req, res) => {
    try {
        const newEvent = { id: Date.now(), ...req.body };
        
        let data = [];
        try {
            const fileContent = await fs.readFile(DATA_FILE, 'utf-8');
            data = JSON.parse(fileContent);
        } catch (e) {
            // Si el archivo está vacío o no existe, empezamos con array vacío
        }
        
        data.push(newEvent);
        
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
        res.status(201).json(newEvent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al guardar' });
    }
});

// 3. BORRAR evento (DELETE)
app.delete('/api/events/:id', async (req, res) => {
    try {
        const idToDelete = parseInt(req.params.id);
        const fileContent = await fs.readFile(DATA_FILE, 'utf-8');
        let data = JSON.parse(fileContent);
        
        // Filtramos para quitar el evento con ese ID
        const newData = data.filter(event => event.id !== idToDelete);
        
        await fs.writeFile(DATA_FILE, JSON.stringify(newData, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar' });
    }
});

// --- INICIAR SERVIDOR ---
app.listen(PORT, () => {
    console.log(`Servidor Tobalaba corriendo en http://localhost:${PORT}`);
});