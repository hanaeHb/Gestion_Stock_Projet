
class commandeModels {
    constructor({id_commande, id_fournisseur, date_commande, status, total}) {
        this.id_commande = id_commande;
        this.id_fournisseur = id_fournisseur;
        this.date_commande = date_commande;
        this.status = status;
        this.total = total;
    }

    validerCommande() {
        this.status = "VALIDE";
    }

    annulerCommande() {
        this.status = "ANNULEE";
    }
}

module.exports = commandeModels;