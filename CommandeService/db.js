const { Pool } = require("pg");


   /* const pool = new Pool({
        host: process.env.DB_HOST || "host.docker.internal",
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "hanae",
        database: process.env.DB_NAME || "commande_system"
    });*/

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "hanae",
    database: process.env.DB_NAME || "commande_system"
});
pool.connect((err) => {
    if (err) console.error("❌ Database connection error", err.stack);
    else console.log("✅ Connected to commande_system database");
});


const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS commandes (
                id_commande VARCHAR(255) PRIMARY KEY,
                id_fournisseur BIGINT NOT NULL,
                date_commande TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(50) DEFAULT 'WAITING_FOR_QUOTATION',
                total NUMERIC(10,2),
                id_request VARCHAR(255)
            )
        `);
        console.log("Table commandes ready ✅");
    } catch (err) {
        console.error("Error creating tables", err);
    }
};

initDb();

module.exports = pool;