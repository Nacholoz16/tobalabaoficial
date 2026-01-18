const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Archivo de destino
const USERS_FILE = path.join(__dirname, 'users.json');

async function createTestUser() {
    console.log("Creando usuario de prueba...");

    // 1. Encriptar la contraseña "admin"
    const password = 'admin';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 2. Crear el objeto de usuarios
    const users = [
        {
            username: "admin",
            passwordHash: hashedPassword,
            role: "superadmin" // Le damos rol máximo para probar todo
        }
    ];

    // 3. Guardar en users.json
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    
    console.log("✅ Archivo users.json creado exitosamente.");
    console.log("Usuario: admin");
    console.log("Contraseña: admin");
}

createTestUser();