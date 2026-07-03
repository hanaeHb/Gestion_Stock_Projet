const { Client } = require("pg");


const client = new Client({
    host: process.env.DB_HOST || "host.docker.internal",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "hanae",
    port: process.env.DB_PORT || 5432
});

/*const client = new Client({
    host: "localhost",
    user: "postgres",
    password: "hanae",
    port: 5432
});*/

client.connect()
    .then(() => {
        console.log("Connected to PostgreSQL server");

        return client.query(
            "SELECT 1 FROM pg_database WHERE datname='procurement_system'"
        );
    })
    .then(result => {
        if (result.rowCount === 0) {
            return client.query("CREATE DATABASE procurement_system");
        }
    })
    .then(() => {
        console.log("Database ready");
        return connectDatabase();
    })
    .catch(err => console.error(err));


// 2. connect to DB
const db = new Client({
    host: process.env.DB_HOST || "host.docker.internal",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "hanae",
    database: process.env.DB_NAME || "procurement_system",
    port: process.env.DB_PORT || 5432
});

/*const db = new Client({
    host: "localhost",
    user: "postgres",
    password: "hanae",
    database: "procurement_system",
    port: 5432
});*/

async function connectDatabase() {
    await db.connect();
    console.log("Connected to procurement_system database");

    await createTables();
}

async function createTables() {

    const fournisseurTable = `
        CREATE TABLE IF NOT EXISTS fournisseurs (
                                                    id_fournisseur SERIAL PRIMARY KEY,
                                                    user_id INTEGER UNIQUE,
                                                    prenom VARCHAR(100),
            nom VARCHAR(100) NOT NULL,
            email VARCHAR(150) UNIQUE NOT NULL,
            telephone VARCHAR(20),
            cin VARCHAR(20),
            adresse TEXT,
            status VARCHAR(20) DEFAULT 'PENDING',
            image TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
    `;

    const specializationTable = `
        CREATE TABLE IF NOT EXISTS fournisseur_specializations (
            id SERIAL PRIMARY KEY,
            id_fournisseur INTEGER REFERENCES fournisseurs(id_fournisseur) ON DELETE CASCADE,
            id_category INTEGER NOT NULL,
            UNIQUE(id_fournisseur, id_category) 
        );
    `;

    try {

        await db.query(fournisseurTable);
        console.log("Table fournisseurs ready ✅");

        await db.query(specializationTable);
        console.log("Table fournisseur_specializations ready ✅");


    } catch (err) {
        console.error("Error creating tables:", err);
    }
}

// 4. EXPORT IMPORTANT
module.exports = db;