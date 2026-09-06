// ==========================================
// EGONARMARKET - SCRIPT PRINCIPAL
// ==========================================

// Récupération du panier
let panier = JSON.parse(
    localStorage.getItem("egonarPanier")
) || [];


// Récupération des produits
let produits = JSON.parse(
    localStorage.getItem("egonarProduits")
) || [];


// ==========================================
// SAUVEGARDER LE PANIER
// ==========================================

function sauvegarderPanier() {
    localStorage.setItem(
        "egonarPanier",
        JSON.stringify(panier)
    );
}


// ==========================================
// COMPTEUR DU PANIER
// ==========================================

function mettreAJourCompteur() {

    const compteur = document.querySelector("#cart-count");

    if (!compteur) {
        return;
    }

    let nombre = 0;

    panier.forEach(function (produit) {
        nombre += produit.quantite;
    });

    compteur.textContent = nombre;
}


// ==========================================
// AJOUTER AU PANIER
// ==========================================

function ajouterAuPanier(id, prix) {

    const produitStock = produits.find(
        function (produit) {
            return produit.id === id;
        }
    );
alert(
    "Stock trouvé : " +
    (produitStock ? produitStock.stock : "AUCUN PRODUIT")
);
    if (produitStock && produitStock.stock <= 0) {

        alert(
            "Désolé, ce produit est en rupture de stock."
        );

        return;
    }

    const produitExistant = panier.find(
        function (produit) {
            return produit.nom === nom;
        }
    );

    if (produitStock && produitExistant) {

        if (produitExistant.quantite >= produitStock.stock) {

            alert(
                "Vous avez atteint la quantité disponible en stock."
            );

            return;
        }

        produitExistant.quantite += 1;

    } else {

        panier.push({
            nom: nom,
            prix: prix,
            quantite: 1
        });
    }

    sauvegarderPanier();
    mettreAJourCompteur();

    alert(
        nom + " a été ajouté au panier !"
    );
}


// ==========================================
// BOUTONS AJOUTER AU PANIER
// ==========================================

const boutonsPanier =
    document.querySelectorAll(".buy-btn");

boutonsPanier.forEach(
    function (bouton) {



        bouton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                const produit =
                    bouton.closest(".product");

                if (!produit) {
                    return;
                }

                const nom =
                    produit
                        .querySelector("h3")
                        .textContent
                        .trim();

                const prix =
                    produit
                        .querySelector(".price")
                        .textContent
                        .trim();

                ajouterAuPanier(nom, prix);
            }
        );
    }
);


// ==========================================
// AFFICHER LE PANIER
// ==========================================

function afficherPanier() {

    const zonePanier =
        document.querySelector("#cart-items");

    const zoneTotal =
        document.querySelector("#cart-total");

    if (!zonePanier || !zoneTotal) {
        return;
    }


    if (panier.length === 0) {

        zonePanier.innerHTML = `
            <div class="empty-cart">
                <h2>Votre panier est vide</h2>

                <p>
                    Ajoutez des produits
                    depuis notre boutique.
                </p>

                <a href="index.html" class="btn">
                    Continuer mes achats
                </a>
            </div>
        `;

        zoneTotal.textContent =
            "Total : 0 FCFA";

        return;
    }


    zonePanier.innerHTML = "";

    let total = 0;


    panier.forEach(
        function (produit, index) {

            const prixNombre =
                parseInt(
                    produit.prix.replace(/\D/g, ""),
                    10
                ) || 0;

            const sousTotal =
                prixNombre * produit.quantite;

            total += sousTotal;


            const article =
                document.createElement("div");

            article.classList.add("cart-item");

            article.innerHTML = `
                <div>
                    <h3>${produit.nom}</h3>

                    <p>
                        Prix unitaire :
                        ${produit.prix}
                    </p>
                </div>

                <div class="cart-actions">

                    <button
                        onclick="diminuerQuantite(${index})"
                    >
                        −
                    </button>

                    <span>
                        ${produit.quantite}
                    </span>

                    <button
                        onclick="augmenterQuantite(${index})"
                    >
                        +
                    </button>

                    <button
                        class="delete-btn"
                        onclick="supprimerProduit(${index})"
                    >
                        Supprimer
                    </button>

                </div>

                <strong>
                    ${sousTotal.toLocaleString("fr-FR")}
                    FCFA
                </strong>
            `;

            zonePanier.appendChild(article);
        }
    );


    zoneTotal.textContent =
        "Total : " +
        total.toLocaleString("fr-FR") +
        " FCFA";
}


// ==========================================
// AUGMENTER QUANTITÉ
// ==========================================

function augmenterQuantite(index) {

    if (!panier[index]) {
        return;
    }

    panier[index].quantite += 1;

    sauvegarderPanier();
    afficherPanier();
    mettreAJourCompteur();
}


// ==========================================
// DIMINUER QUANTITÉ
// ==========================================

function diminuerQuantite(index) {

    if (!panier[index]) {
        return;
    }

    panier[index].quantite -= 1;

    if (panier[index].quantite <= 0) {
        panier.splice(index, 1);
    }

    sauvegarderPanier();
    afficherPanier();
    mettreAJourCompteur();
}


// ==========================================
// SUPPRIMER PRODUIT
// ==========================================

function supprimerProduit(index) {

    if (!panier[index]) {
        return;
    }

    panier.splice(index, 1);

    sauvegarderPanier();
    afficherPanier();
    mettreAJourCompteur();
}


// ==========================================
// TOTAL DU PANIER
// ==========================================

function calculerTotalPanier() {

    let total = 0;

    panier.forEach(
        function (produit) {

            const prix =
                parseInt(
                    produit.prix.replace(/\D/g, ""),
                    10
                ) || 0;

            total +=
                prix * produit.quantite;
        }
    );

    return total;
}


// ==========================================
// AFFICHER LA COMMANDE
// ==========================================
function afficherCommande() {

    const zoneProduits = document.querySelector("#order-items");
    const zoneTotal = document.querySelector("#order-total");

    if (!zoneProduits || !zoneTotal) {
        return;
    }

    if (panier.length === 0) {

        zoneProduits.innerHTML = `
            <p>Votre panier est vide.</p>
        `;

        zoneTotal.textContent = "Total : 0 FCFA";

        return;
    }

    zoneProduits.innerHTML = "";

    let total = 0;

    panier.forEach(function (produit) {

        const prix =
            parseInt(
                produit.prix.replace(/\D/g, ""),
                10
            ) || 0;

        const sousTotal =
            prix * produit.quantite;

        total += sousTotal;

        zoneProduits.innerHTML += `
            <div class="order-item">
                <p>
                    <strong>${produit.nom}</strong>
                    × ${produit.quantite}
                </p>

                <p>
                    ${sousTotal.toLocaleString("fr-FR")} FCFA
                </p>
            </div>
        `;
    });

    zoneTotal.textContent =
        "Total : " +
        total.toLocaleString("fr-FR") +
        " FCFA";
}
// ==========================================
// ENREGISTRER LA COMMANDE
// ==========================================

function enregistrerCommande() {

    const nom =
        document.querySelector("#nom").value.trim();

    const telephone =
        document.querySelector("#telephone").value.trim();

    const ville =
        document.querySelector("#ville").value.trim();

    const adresse =
        document.querySelector("#adresse").value.trim();

    const livraison =
        document.querySelector("#livraison").value;

    const paiement =
        document.querySelector("#paiement").value;


    const commande = {

        id: "CMD-" + Date.now(),

        date: new Date().toLocaleString("fr-FR"),

        client: {
            nom: nom,
            telephone: telephone,
            ville: ville,
            adresse: adresse
        },

        livraison: livraison,

        paiement: paiement,

        produits: panier.map(function (produit) {

            return {
                nom: produit.nom,
                prix: produit.prix,
                quantite: produit.quantite
            };

        }),

        total: calculerTotalPanier(),

        statut: "Nouvelle"
    };


    let commandes =
        JSON.parse(
            localStorage.getItem("egonarCommandes")
        ) || [];


    commandes.push(commande);


    localStorage.setItem(
        "egonarCommandes",
        JSON.stringify(commandes)
    );


    return commande;
}
// Diminuer le stock des produits commandés

panier.forEach(function (produitPanier) {

    const produitStock = produits.find(function (produit) {
        return produit.nom === produitPanier.nom;
    });

    if (produitStock) {

        produitStock.stock -= produitPanier.quantite;

    }

});

localStorage.setItem(
    "egonarProduits",
    JSON.stringify(produits)
);

// ==========================================
// FORMULAIRE DE COMMANDE
// ==========================================

const formulaireCommande =
    document.querySelector("#order-form");


if (formulaireCommande) {

    afficherCommande();


    formulaireCommande.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            // Vérifier que le panier n'est pas vide
            if (panier.length === 0) {

                alert("Votre panier est vide.");

                return;
            }


            // Enregistrer la commande
            const commande =
                enregistrerCommande();


            // Récupérer les informations
            const nom =
                document.querySelector("#nom").value.trim();

            const telephone =
                document.querySelector("#telephone").value.trim();

            const ville =
                document.querySelector("#ville").value.trim();

            const adresse =
                document.querySelector("#adresse").value.trim();

            const livraison =
                document.querySelector("#livraison").value;

            const paiement =
                document.querySelector("#paiement").value;


            // Zone de confirmation
            const message =
                document.querySelector("#order-message");

            const zoneConfirmation =
                document.querySelector("#order-success");


            // Afficher toutes les informations
            message.innerHTML = `

                <div class="confirmation-details">

                    <p>
                        <strong>Numéro de commande :</strong>
                        ${commande.id}
                    </p>

                    <p>
                        <strong>Client :</strong>
                        ${nom}
                    </p>

                    <p>
                        <strong>Téléphone :</strong>
                        ${telephone}
                    </p>

                    <p>
                        <strong>Ville :</strong>
                        ${ville}
                    </p>

                    <p>
                        <strong>Adresse :</strong>
                        ${adresse}
                    </p>

                    <p>
                        <strong>Livraison :</strong>
                        ${livraison}
                    </p>

                    <p>
                        <strong>Paiement :</strong>
                        ${paiement}
                    </p>

                    <p>
                        <strong>Total :</strong>
                        ${Number(commande.total).toLocaleString("fr-FR")}
                        FCFA
                    </p>

                </div>

            `;


            // Afficher la confirmation
            zoneConfirmation.style.display = "block";


            // Vider le panier après enregistrement
            panier = [];

            sauvegarderPanier();

            mettreAJourCompteur();


            // Remonter vers la confirmation
            zoneConfirmation.scrollIntoView({
                behavior: "smooth"
            });

        }
    );
}
// ==========================================
// ADMINISTRATION
// ==========================================

function afficherCommandesAdmin() {

    const zoneCommandes =
        document.querySelector("#admin-orders");

    const compteur =
        document.querySelector("#total-orders");

    const ventes =
        document.querySelector("#total-sales");

    if (!zoneCommandes) {
        return;
    }

    const commandes =
        JSON.parse(
            localStorage.getItem("egonarCommandes")
        ) || [];


    // Nombre de commandes

    if (compteur) {
        compteur.textContent = commandes.length;
    }


    // Calcul du chiffre d'affaires

    let chiffreAffaires = 0;

    commandes.forEach(function (commande) {

        chiffreAffaires +=
            Number(commande.total) || 0;

    });


    if (ventes) {

        ventes.textContent =
            chiffreAffaires.toLocaleString("fr-FR") +
            " FCFA";

    }


    // Aucune commande

    if (commandes.length === 0) {

        zoneCommandes.innerHTML = `
            <div class="admin-order">

                <h3>Aucune commande</h3>

                <p>
                    Les nouvelles commandes
                    apparaîtront ici.
                </p>

            </div>
        `;

        return;
    }


    zoneCommandes.innerHTML = "";


    // Afficher les commandes de la plus récente
    // à la plus ancienne

    commandes
        .slice()
        .reverse()
        .forEach(function (commande) {

            let produitsHTML = "";


            commande.produits.forEach(
                function (produit) {

                    produitsHTML += `
                        <li>
                            ${produit.nom}
                            × ${produit.quantite}
                        </li>
                    `;

                }
            );


            const bloc =
                document.createElement("div");

            bloc.classList.add("admin-order");


            bloc.innerHTML = `

                <h3>
                    ${commande.id}
                </h3>

                <p>
                    <strong>Date :</strong>
                    ${commande.date}
                </p>

                <p>
                    <strong>Client :</strong>
                    ${commande.client.nom}
                </p>

                <p>
                    <strong>Téléphone :</strong>
                    ${commande.client.telephone}
                </p>

                <p>
                    <strong>Ville :</strong>
                    ${commande.client.ville}
                </p>

                <p>
                    <strong>Adresse :</strong>
                    ${commande.client.adresse}
                </p>

                <p>
                    <strong>Livraison :</strong>
                    ${commande.livraison}
                </p>

                <p>
                    <strong>Paiement :</strong>
                    ${commande.paiement}
                </p>

                <p>
                    <strong>Produits :</strong>
                </p>

                <ul>
                    ${produitsHTML}
                </ul>

                <p>
                    <strong>Total :</strong>
                    ${Number(commande.total).toLocaleString("fr-FR")}
                    FCFA
                </p>

                <div class="status-box">

                    <label>
                        <strong>Statut :</strong>
                    </label>

                    <select
                        onchange="changerStatut('${commande.id}', this.value)"
                    >

                        <option
                            value="Nouvelle"
                            ${commande.statut === "Nouvelle" ? "selected" : ""}
                        >
                            Nouvelle
                        </option>

                        <option
                            value="Confirmée"
                            ${commande.statut === "Confirmée" ? "selected" : ""}
                        >
                            Confirmée
                        </option>

                        <option
                            value="Expédiée"
                            ${commande.statut === "Expédiée" ? "selected" : ""}
                        >
                            Expédiée
                        </option>

                        <option
                            value="Livrée"
                            ${commande.statut === "Livrée" ? "selected" : ""}
                        >
                            Livrée
                        </option>

                        <option
                            value="Annulée"
                            ${commande.statut === "Annulée" ? "selected" : ""}
                        >
                            Annulée
                        </option>

                    </select>

                </div>

            `;


            zoneCommandes.appendChild(bloc);

        });

}


// ==========================================
// CHANGER LE STATUT D'UNE COMMANDE
// ==========================================

function changerStatut(idCommande, nouveauStatut) {

    let commandes =
        JSON.parse(
            localStorage.getItem("egonarCommandes")
        ) || [];


    const commande =
        commandes.find(function (element) {

            return element.id === idCommande;

        });


    if (!commande) {

        alert(
            "Commande introuvable."
        );

        return;
    }


    commande.statut = nouveauStatut;


    localStorage.setItem(
        "egonarCommandes",
        JSON.stringify(commandes)
    );


    afficherCommandesAdmin();

}
// ==========================================
// GESTION DES PRODUITS
// ==========================================



// ==========================================
// AFFICHER LES PRODUITS DANS L'ADMIN
// ==========================================

function afficherProduitsAdmin() {

    const zoneProduits =
        document.querySelector("#admin-products");

    if (!zoneProduits) {
        return;
    }

    zoneProduits.innerHTML = "";

    if (produits.length === 0) {

        zoneProduits.innerHTML =
            "<p>Aucun produit enregistré.</p>";

        return;
    }

    produits.forEach(function (produit) {

        const carte = document.createElement("div");

        carte.className = "admin-product-card";

        carte.innerHTML = `

            <h4>${produit.nom}</h4>

            <p>
                <strong>Prix :</strong>
                ${produit.prix.toLocaleString("fr-FR")} FCFA
            </p>

            <p>
                <strong>Catégorie :</strong>
                ${produit.categorie}
            </p>

            <p>
                <strong>Stock :</strong>
                ${produit.stock}
            </p>

            <p>
                <strong>Description :</strong>
                ${produit.description}
            </p>

            <p>
                <strong>Image :</strong>
                ${produit.image}
            </p>
<button class="btn" onclick="modifierProduit('${produit.id}')">
    ✏️ Modifier
</button>

<button class="btn" onclick="supprimerProduit('${produit.id}')">
    🗑️ Supprimer
</button>
        `;

        zoneProduits.appendChild(carte);

    });
}


// Afficher les produits au chargement de la page

afficherProduitsAdmin();
// ==========================================
// SUPPRIMER UN PRODUIT
// ==========================================

function supprimerProduit(id) {

    const confirmation = confirm(
        "Voulez-vous vraiment supprimer ce produit ?"
    );

    if (!confirmation) {
        return;
    }

    produits = produits.filter(function (produit) {
        return produit.id !== id;
    });

    localStorage.setItem(
        "egonarProduits",
        JSON.stringify(produits)
    );

    afficherProduitsAdmin();


    alert("Produit supprimé avec succès !");
}


// ==========================================
// MODIFIER UN PRODUIT
// ==========================================

function modifierProduit(id) {

    const produit = produits.find(function (produit) {
        return produit.id === id;
    });

    if (!produit) {
        return;
    }

    const nouveauNom = prompt(
        "Nom du produit :",
        produit.nom
    );

    if (nouveauNom === null) {
        return;
    }

    const nouveauPrix = prompt(
        "Prix en FCFA :",
        produit.prix
    );

    if (nouveauPrix === null) {
        return;
    }

    const nouveauStock = prompt(
        "Stock :",
        produit.stock
    );

    if (nouveauStock === null) {
        return;
    }

    produit.nom = nouveauNom.trim();
    produit.prix = Number(nouveauPrix);
    produit.stock = Number(nouveauStock);

    localStorage.setItem(
        "egonarProduits",
        JSON.stringify(produits)
    );

    afficherProduitsAdmin();

    alert("Produit modifié avec succès !");
}// ==========================================
// AFFICHER LES PRODUITS DANS LA BOUTIQUE
// ==========================================

function afficherProduitsBoutique() {

    const zoneProduits =
        document.querySelector("#products-list");

    if (!zoneProduits) {
        return;
    }

    zoneProduits.innerHTML = "";

    produits.forEach(function (produit) {

        const carte = document.createElement("div");

        carte.className = "product";

        carte.innerHTML = `

            <div class="product-image">
                📦
            </div>

            <div class="product-info">

                <h3>
                    ${produit.nom}
                </h3>

                <p class="price">
                    ${produit.prix.toLocaleString("fr-FR")} FCFA
                </p>

                <p>
                    ${produit.description}
                </p>

               <button
    class="buy-btn"
    onclick="ajouterAuPanier('${produit.id}', ${produit.prix})"
>
    Ajouter au panier
</button>

            </div>

        `;

        zoneProduits.appendChild(carte);

    });
}

afficherProduitsBoutique();
// ==========================================
// AJOUTER UN PRODUIT
// ==========================================

const formulaireProduit =
    document.querySelector("#product-form");

if (formulaireProduit) {

    alert("LE FORMULAIRE FONCTIONNE");

    formulaireProduit.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            const nom =
                document.querySelector("#product-name").value.trim();

            const prix =
                Number(
                    document.querySelector("#product-price").value
                );

            const categorie =
                document.querySelector("#product-category").value.trim();

            const description =
                document.querySelector("#product-description").value.trim();

            const image =
                document.querySelector("#product-image").value.trim();

            const stock =
                Number(
                    document.querySelector("#product-stock").value
                );


            const nouveauProduit = {

                id: "PROD-" + Date.now(),

                nom: nom,

                prix: prix,

                categorie: categorie,

                description: description,

                image: image,

                stock: stock
            };


            produits.push(nouveauProduit);

            alert("Nombre de produits : " + produits.length);

            localStorage.setItem(
                "egonarProduits",
                JSON.stringify(produits)
            );


          alert("Produit ajouté avec succès !");

afficherProduitsAdmin();

formulaireProduit.reset();

        }
    );
}


// ==========================================
// INITIALISATION
// ==========================================

mettreAJourCompteur();

afficherPanier();

afficherCommande();

afficherCommandesAdmin();