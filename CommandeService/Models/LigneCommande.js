class LigneCommande {
    constructor({id_ligne, id_commande, id_produit, quantite, prix_unitaire}) {
        this.id_ligne = id_ligne;
        this.id_commande = id_commande;
        this.id_produit = id_produit;
        this.quantite = quantite;
        this.prix_unitaire = prix_unitaire;
    }
}

module.exports = LigneCommande;