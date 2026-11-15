# Projet Radar Steelbook

## Objectif
Devenir « l'alerteur de steelbook » sur TikTok : prévenir dès qu'un steelbook 4K est disponible en précommande, et monétiser par affiliation (lien Amazon avec l'identifiant partenaire).

## Marques et canaux
- Chaîne TikTok : **LE DARON** (100 % steelbooks). Sur les slides et vidéos, écrire « LE DARON ».
- Site : https://antho24kb.github.io/RadarSteelbook/ (GitHub Pages, dépôt public `antho24kb/RadarSteelbook`)
- Page principale (hub, accueil du site) : `index.html` (design sombre « étiquette vidéo », polices locales dans `fonts/`). `radar-steelbook.html` en est une copie exacte conservée pour les anciens liens (TikTok, flux RSS) : on modifie toujours `index.html`, puis on lance `node scripts/sync-hub.mjs`. Contrôle avant publication : `node scripts/check-site.mjs`.
- Page liste simple : `steelbook.html` (fond crème, steelbooks 4K avec logo Amazon actif)
- Autres pages : `liste.html`, `merci-liste.html`, `psycho.html`, `cadeaux-collectionneurs.html` (guide cadeaux, ex-`index.html`, mis à jour chaque vendredi par une tâche planifiée), flux `feed.xml`
- Alertes par e-mail : Brevo (formulaire « Alertes steelbook », double confirmation)
- Statistiques TikTok : Metricool

## Affiliation
- Amazon Partenaires France : un seul identifiant pour tous les projets, `antho24kb-21`. Les liens Amazon sont fournis par Antho et utilisés tels quels.
- Awin : Fnac France demandée, nouvelle demande possible le 26 novembre 2026. Si acceptée : ajouter un bouton « Voir à la Fnac » sur la page radar.
- Aucun prix affiché sur les visuels et vidéos (règle Amazon Partenaires).

## Structure des pages
- Bloc `ALERTE-UNE` en haut de `steelbook.html` et `index.html` (puis `node scripts/sync-hub.mjs` pour `radar-steelbook.html`) : 4 précommandes maximum.
- Catalogue `data/steelbooks.json` (chargé par `index.html`) : liste complète, triée par date.
- Les sorties dont la date est passée n'ont plus de lien et affichent « Disponible ».

## Calendrier de publication TikTok
Voir REGLES.md (« Calendrier TikTok LE DARON » et « Méthode vidéo et règles par format »). Stats : STATS.md.
