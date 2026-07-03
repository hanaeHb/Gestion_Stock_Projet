const db = require("../db")

/**
 * GET ALL FOURNISSEURS
 */
exports.getAll = async (req, res) => {
    try {

        const result = await db.query("SELECT * FROM fournisseurs ORDER BY id_fournisseur DESC");

        res.json({
            requestedBy: req.user?.email,
            roles: req.user?.roles,
            fournisseurs: result.rows
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Erreur fetching fournisseurs",
            error: error.message
        });

    }
};

/**
 * GET MY FOURNISSEUR PROFILE
 */
exports.getMyProfile = async (req, res) => {
    try {
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized - no userId in token"
            });
        }

        // check f DB
        let result = await db.query(
            `SELECT
                 id_fournisseur AS "idFournisseur",
                 user_id AS "userId",
                 nom,
                 prenom,
                 email,
                 telephone AS phone,
                 cin,
                 adresse,
                 status,
                 image,
                 created_at AS "createdAt"
             FROM fournisseurs
             WHERE user_id=$1`,
            [userId]
        );

        let fournisseur;

        if (result.rows.length === 0) {
            // fallback values ila ma kaynch f token / DB
            const nom = req.user.nom || '';
            const prenom = req.user.prenom || '';
            const email = req.user.email || '';
            const phone = req.user.phone || '';
            const cin = req.user.cin || '';

            const createResult = await db.query(
                `INSERT INTO fournisseurs (user_id, nom, prenom, email, telephone, cin, status)
                 VALUES ($1,$2,$3,$4,$5,$6,'VALIDATED')
                     RETURNING 
                        id_fournisseur AS "idFournisseur",
                        user_id AS "userId",
                        nom,
                        prenom,
                        email,
                        telephone AS phone,
                        cin,
                        adresse,
                        status,
                        image,
                        created_at AS "createdAt"`,
                [userId, nom, prenom, email, phone, cin]
            );

            fournisseur = createResult.rows[0];

        } else {
            fournisseur = result.rows[0];

            // ila cin null f DB, update b fallback
            if (!fournisseur.cin) {
                const fallbackCin = req.user.cin || `UNKNOWN-${Date.now()}`;
                const updateResult = await db.query(
                    `UPDATE fournisseurs SET cin=$1 WHERE user_id=$2 RETURNING cin`,
                    [fallbackCin, userId]
                );
                fournisseur.cin = updateResult.rows[0].cin;
            }
        }

        res.json({
            message: "My fournisseur profile",
            fournisseur
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur récupération profil fournisseur",
            error: error.message
        });
    }
};

/**
 * UPDATE MY FOURNISSEUR PROFILE
 */

const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const uniqueName = `fournisseur_${req.user.userId}_${Date.now()}${ext}`;
        cb(null, uniqueName);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // max 5MB
});

exports.uploadImageMiddleware = upload.single('image');

// Update profile
exports.updateMyProfile = async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { nom, prenom, phone, email, cin } = req.body;
    let imagePath;

    if (req.file) {
        // user uploadach image → save path normal
        imagePath = `/uploads/${req.file.filename}`;
    } else {
        // ila ma kaynch image → create default image if not exists
        const defaultImageName = `fournisseur_${userId}_default.png`;
        const defaultImagePath = path.join(__dirname, '../uploads', defaultImageName);

        // ila file ma kaynch f uploads → create empty/default file
        if (!fs.existsSync(defaultImagePath)) {
            const emptyBuffer = Buffer.alloc(0); // simple empty file, wla replace b icon png
            fs.writeFileSync(defaultImagePath, emptyBuffer);
        }

        imagePath = `/uploads/${defaultImageName}`;
    }

    try {
        const result = await db.query(
            `UPDATE fournisseurs
             SET nom = COALESCE($1, nom),
                 prenom = COALESCE($2, prenom),
                 telephone = COALESCE($3, telephone),
                 cin = COALESCE($4, cin),
                 email = COALESCE($5, email),
                 image = COALESCE($6, image)
             WHERE user_id = $7
             RETURNING 
                id_fournisseur AS "idFournisseur",
                user_id AS "userId",
                nom,
                prenom,
                email,
                telephone AS phone,
                cin,
                adresse,
                status,
                image,
                created_at AS "createdAt"`,
            [nom, prenom, phone, cin, email, imagePath, userId]
        );

        console.log("REQ FILE =>", req.file);
        res.json({ message: "Profile updated", fournisseur: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating profile", error: error.message });
    }
};

/**
 * GET FOURNISSEUR BY ID
 */
exports.getById = async (req, res) => {

    const { id } = req.params;

    try {

        const result = await db.query(
            "SELECT * FROM fournisseurs WHERE id_fournisseur=$1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Fournisseur not found" });
        }

        res.json(result.rows[0]);

    } catch (error) {

        res.status(500).json({
            message: "Erreur fetching fournisseur",
            error: error.message
        });

    }
};
exports.getSpecializations = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            "SELECT id_category FROM fournisseur_specializations WHERE id_fournisseur = $1",
            [id]
        );

        const categoryIds = result.rows.map(row => row.id_category);

        res.status(200).json(categoryIds);
    } catch (err) {
        console.error("Error fetching specializations:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.updateSpecializations = async (req, res) => {
    const { categoryIds } = req.body;

    const userId = req.user.userId || req.user.id || req.user.sub;

    console.log("--- DEBUG ---");
    console.log("User ID from Token:", userId);

    if (!userId) {
        return res.status(401).json({ message: "Utilisateur non identifié dans le token" });
    }

    try {
        const fResult = await db.query("SELECT id_fournisseur FROM fournisseurs WHERE user_id = $1", [userId]);

        if (fResult.rowCount === 0) {
            console.error(" Aucun fournisseur trouvé pour user_id:", userId);
            return res.status(404).json({ message: "Fournisseur non trouvé. Vérifiez votre profil." });
        }

        const id_fournisseur = fResult.rows[0].id_fournisseur;

        await db.query("DELETE FROM fournisseur_specializations WHERE id_fournisseur = $1", [id_fournisseur]);

        if (categoryIds && categoryIds.length > 0) {
            const insertQueries = categoryIds.map(catId => {
                return db.query(
                    "INSERT INTO fournisseur_specializations (id_fournisseur, id_category) VALUES ($1, $2)",
                    [id_fournisseur, catId]
                );
            });
            await Promise.all(insertQueries);
        }

        res.status(200).json({ message: "Spécialisations mises à jour ✅" });
    } catch (err) {
        console.error("DATABASE ERROR:", err.message);
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};

exports.getFournisseursByCategory = async (req, res) => {
    const categoryId = parseInt(req.params.categoryId, 10);

    console.log("Recherche pour categoryId:", categoryId);

    if (isNaN(categoryId)) {
        return res.status(400).json({ message: "ID de catégorie invalide" });
    }

    try {

        const query = `
            SELECT DISTINCT f.* FROM fournisseurs f
                                         JOIN fournisseur_specializations fs ON f.id_fournisseur = fs.id_fournisseur
            WHERE fs.id_category = $1
        `;

        const result = await db.query(query, [categoryId]);

        console.log(`Trouvé ${result.rowCount} fournisseurs pour la catégorie ${categoryId}`);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Erreur SQL detailed:", err.message);
        res.status(500).json({ message: "Erreur serveur" });
    }
};
/**
 * CREATE FOURNISSEUR
 */
exports.create = async (req, res) => {

    try {

        const { nom, email, telephone, adresse } = req.body;

        const result = await db.query(
            `INSERT INTO fournisseurs (nom,email,telephone,cin,adresse)
             VALUES ($1,$2,$3,$4)
             RETURNING *`,
            [nom, email, telephone,cin, adresse]
        );

        res.status(201).json({
            message: "Fournisseur created",
            createdBy: req.user?.email,
            fournisseur: result.rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Erreur création fournisseur",
            error: error.message
        });

    }
};


/**
 * UPDATE FOURNISSEUR
 */
exports.update = async (req, res) => {

    const { id } = req.params;

    try {

        const result = await db.query(
            "SELECT * FROM fournisseurs WHERE id_fournisseur=$1",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Fournisseur not found" });
        }

        const fournisseur = result.rows[0];

        const updatedData = {
            nom: req.body.nom ?? fournisseur.nom,
            email: req.body.email ?? fournisseur.email,
            telephone: req.body.telephone ?? fournisseur.telephone,
            adresse: req.body.adresse ?? fournisseur.adresse,
            status: req.body.status ?? fournisseur.status
        };

        const updateResult = await db.query(
            `UPDATE fournisseurs
             SET nom=$1, email=$2, telephone=$3, adresse=$4, status=$5
             WHERE id_fournisseur=$6
             RETURNING *`,
            [
                updatedData.nom,
                updatedData.email,
                updatedData.telephone,
                updatedData.adresse,
                updatedData.status,
                id
            ]
        );

        res.json({
            message: "Fournisseur updated",
            updatedBy: req.user?.email,
            fournisseur: updateResult.rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Erreur mise à jour fournisseur",
            error: error.message
        });

    }
};


/**
 * DELETE FOURNISSEUR
 */
exports.delete = async (req, res) => {

    const { id } = req.params;

    try {

        await db.query(
            "DELETE FROM fournisseurs WHERE id_fournisseur=$1",
            [id]
        );

        res.json({
            message: "Fournisseur deleted",
            deletedBy: req.user?.email
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Erreur suppression fournisseur",
            error: error.message
        });

    }
};

exports.activer = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            "UPDATE fournisseurs SET status='ACTIVE' WHERE id_fournisseur=$1 RETURNING *",
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Fournisseur not found" });
        }
        res.json({
            message: "Fournisseur activated",
            fournisseur: result.rows[0],
            updatedBy: req.user?.email
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur activation fournisseur",
            error: error.message
        });
    }
};

exports.desactiver = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            "UPDATE fournisseurs SET status='INACTIVE' WHERE id_fournisseur=$1 RETURNING *",
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Fournisseur not found" });
        }
        res.json({
            message: "Fournisseur deactivated",
            fournisseur: result.rows[0],
            updatedBy: req.user?.email
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Erreur désactivation fournisseur",
            error: error.message
        });
    }
};