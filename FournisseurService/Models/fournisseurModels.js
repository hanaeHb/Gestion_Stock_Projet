class FournisseurModels {
    constructor({
                    idFournisseur,
                    nom,
                    prenom,
                    email,
                    telephone,
                    cin,
                    adresse,
                    status,
                    createdAt,
                    image,
                }) {
        this.idFournisseur = idFournisseur;
        this.nom = nom;
        this.prenom = prenom;
        this.email = email;
        this.telephone = telephone;
        this.cin = cin;
        this.adresse = adresse;
        this.status = status;
        this.createdAt = createdAt;
        this.image = image;
    }
}

module.exports = FournisseurModels;
