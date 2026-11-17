# Règles permanentes (ne pas supprimer sans l'accord d'Antho)

## Quand Antho envoie « Alerte » + un lien Amazon
1. Créer une vidéo TikTok avec le **modèle figé** (steelbook centré et agrandi, accroche « NOUVELLE PRÉCOMMANDE OUVERTE », bouton « lien en bio », ligne « Prix et dispo sur Amazon · Lien affilié, sans surcoût »). On change seulement l'affiche, la date et la couleur du fond. **Pas de prix.** Style calme, pas de rouge « urgent » agressif, pas de fond uni.
2. Ajouter le steelbook dans le bloc `ALERTE-UNE` (4 maximum, retirer le plus ancien) de `steelbook.html` et `index.html` (puis `node scripts/sync-hub.mjs` pour recopier `radar-steelbook.html`), dans `data/steelbooks.json`, et dans `feed.xml`.
3. Mettre à jour le brouillon du mail récap quotidien dans Brevo.
4. Toujours donner la description TikTok prête à copier : accroche avec titre, date de sortie, lien en bio, ligne d'inscription au mail du soir, mention « lien affilié Amazon », hashtags, **sans prix**.
5. Si la sortie est le lendemain : ajouter une phrase pour acheter vite.

## E-mails Brevo
- Claude prépare le brouillon, **Antho envoie lui-même**. Aucune IA n'envoie.
- Un seul mail récap par jour à 19h, seulement s'il y a plus d'un inscrit.

## Contenu et données
- Seuls les steelbooks 4K avec logo Amazon actif sur 4k-ultra-hd.fr/steelbook-4k (page 1) vont dans `steelbook.html`.
- Les dates de sortie doivent être confirmées par Antho en cas de doute. Ne pas deviner une date.
- Ne jamais cliquer ni tester les liens affiliés Amazon (conditions du programme).
- Carrousels TikTok : numéroter toutes les slides, garder le contenu dans la zone visible (environ 75 % de la hauteur), vraies photos de boîtiers.
- Vidéos « duel steelbook » : modèle Dune, 20 s, sans musique (Antho gère la musique), effets sonores légers en thème du film, marque LE DARON.
- Unboxings : garder le son d'origine, vitesse normale, beaucoup de coupes.

## Écran de conclusion « ABONNE-TOI » (règle permanente, validée par Antho le 17 nov. 2026)
- Obligatoire à la fin de CHAQUE contenu TikTok LE DARON, sans exception de format : carrousels = dernière slide (toujours après la slide finale existante : question, lien en bio, etc.) ; vidéos = séquence de fin animée de 3,2 s ajoutée à la suite.
- Formats concernés : Sorties de la semaine, Sortie du jour, Le Duel, La Question du Daron (version 1080×1440), Bon plan du Daron, alertes précommande et retour en stock, carrousels de Noël, Ma collection et Unboxing (Antho filme : Claude monte et ajoute la séquence ; si Antho monte lui-même, il colle `abonne-toi-fin.mp4` en fin de vidéo), et tout futur format.
- Texte fixe : « ABONNE-TOI » (pastille or, bien lisible) + accroche « Pour ne rien rater de l'univers Steelbook ! ». Charte inchangée : fond noir #111318 avec lueur dorée, or #F5B642, blanc, cadres d'angle, signature « LE DARON » en haut à gauche. Rien d'autre à l'écran.
- Fichiers prêts à l'emploi dans `charte/` : `abonne-toi-1080x1920.png` (carrousels), `abonne-toi-1080x1440.png` (La Question du Daron), `abonne-toi-fin.mp4` (vidéos, muet), et `generer-abonne-toi.py` pour les régénérer. Ne pas modifier le design sans validation d'Antho.
- Contrôle avant livraison de tout contenu : la conclusion est bien présente (dernière slide ou dernière séquence).

## Design
- Pas de rendu « trop IA » : ni fonds dégradés génériques, ni effets néon gratuits.
- Mobile d'abord (iPhone) : tout visible sans défiler horizontalement, largeur de test 390 px.

## Calendrier TikTok LE DARON (mis à jour le 14 nov. 2026)
- 1 publication par jour à 19h00 : lun Sorties de la semaine (carrousel) · mar Ma collection (Antho) · mer Sortie du jour (carrousel) · jeu Unboxing (Antho) · ven Le Duel (vidéo) · **sam 12h LA QUESTION DU DARON 📺 (carrousel communautaire)** · dim Bon plan du Daron (carrousel).
- « Le saviez-vous ? » est supprimé (décision d'Antho, 14 nov. 2026) ; plus de publication le samedi à 19h.
- La Question du Daron : question forte dès la slide 1, but = commentaires ; charte LE DARON ; format 1080×1440 (TikTok coupe le 1080×1920 en carrousel photo) ; MonBonEcran.fr seulement pour les sujets télé / image ; thèmes en rotation, préparés dans le planning mensuel.
- Thèmes : télé · lecteur Blu-ray 4K · OLED ou Mini LED · Dolby Vision ou HDR10 · réglages optimisés · système audio · taille d'écran · dans le noir ou avec lumière d'ambiance (Ambilight = Philips uniquement).

## Méthode vidéo et règles par format (15 nov. 2026, validé par Antho)
- Structure guide (pas une durée imposée) : 0-2 s accroche forte et immédiate · 2-8 s visuels, gros plans, détails des steelbooks · 8-17 s info, comparaison ou avis · 17-23 s question qui appelle les commentaires.
- Le Duel : éditions visibles dès la 1re seconde, vraie opposition, un argument court par édition, question « laquelle tu défends, et pourquoi ? » (pas un simple vote).
- Sorties de la semaine / du jour : la sortie la plus forte en 1re slide, visuels et infos soignés, question sur la précommande ou la préférence, pas de simple catalogue.
- Unboxing : Antho filme ; structure gros plans → ouverture → finitions → détails ; voix facultative.
- Ma collection : format conservé ; valoriser éditions, coffrets, détails ; meilleur gros plan dans les 2 premières secondes.
- Bon plan du Daron : produit et intérêt avant le prix ; prix et dispo vérifiés ; lien affilié correct ; Radar Steelbook amené naturellement.
- Alertes : steelbook visible dès la 1re image. Terminer par la séquence « ABONNE-TOI » (voir section dédiée).
- Publication à 19h (exception : La Question du Daron le samedi à 12h). Charte, calendrier et formats inchangés sans validation d'Antho. « Le saviez-vous ? » ne revient pas. Identité steelbook au centre, Radar Steelbook comme destination.
- Suivi : chaque soir, relevé silencieux des stats à 24h et 7j dans STATS.md ; chaque dimanche 12h, rapport hebdo (meilleures/moins bonnes publications, formats en hausse/baisse, meilleures accroches, rétention, recommandations) avant la préparation de la semaine.

- Semaine du 16 nov. : La Question du Daron du samedi 21 nov. publiée à 18h (demande d'Antho, exception ponctuelle ; le créneau habituel reste samedi 12h). Prochain thème en réserve : lecteur Blu-ray 4K.

- Hub protégé : `index.html` est l'accueil Radar Steelbook (marqueur `HUB-RADAR`). Aucune tâche ni automatisation ne doit le remplacer par le guide cadeaux, qui vit dans `cadeaux-collectionneurs.html`. Avant toute publication du site : `node scripts/check-site.mjs` doit afficher 0 erreur.
