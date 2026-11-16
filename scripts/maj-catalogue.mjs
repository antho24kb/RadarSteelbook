// Depuis la racine du dépôt : node scripts/maj-catalogue.mjs operations.json [--aujourdhui AAAA-MM-JJ] [--simulation]
// Seul point d'entrée de la tâche automatique « Mise à jour steelbooks 4K » pour modifier data/steelbooks.json.
// Le fichier d'opérations est un tableau JSON ; trois opérations sont possibles :
//   { "op": "ajouter", "titre": "…", "date": "AAAA-MM-JJ", "source": "4k-ultra-hd.fr", "amazon": "O", "description": "…(facultatif)" }
//   { "op": "dater",   "id": "…", "date": "AAAA-MM-JJ", "source": "4k-ultra-hd.fr" }
//   { "op": "retirer", "id": "…", "motif": "amazon_N", "icone": "r-ONON", "source": "4k-ultra-hd.fr" }
// Règles appliquées ici (pas de décision laissée au hasard) : id calculé par le script, jamais de doublon (titre normalisé identique ou contenu),
// liens affiliés jamais modifiés (lien de recherche créé par le script, lien ASIN jamais touché), dates exactes seulement,
// produits « conserver: true » jamais retirés, exclusions lues dans data/exclusions.json (jamais écrites ici) et jamais réintroduites,
// aucune suppression sans motif « amazon_N » confirmé, jamais de statut « confirmee » posé automatiquement (au mieux « annoncee »),
// une date exacte divergente d'une date « confirmee » est signalée, jamais appliquée ; une date « a_confirmer » reçoit la date exacte (statut annoncee).
// Le script n'écrit que data/steelbooks.json (et la date du pied de page de steelbook.html si quelque chose a changé).
// Il affiche un rapport JSON {appliques, refuses}. Ensuite seulement : validate-steelbooks, build-catalogue, sync-hub, check-site.
import { readFile, writeFile } from "node:fs/promises";

const args = process.argv.slice(2);
const fichierOps = args.find((a) => !a.startsWith("--"));
const opt = (nom) => { const i = args.indexOf(nom); return i >= 0 ? args[i + 1] : undefined; };
const SIMULATION = args.includes("--simulation");
const aujourdhui = opt("--aujourdhui") || new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
if (!fichierOps) { console.error("Usage : node scripts/maj-catalogue.mjs operations.json [--aujourdhui AAAA-MM-JJ] [--simulation]"); process.exit(2); }

const DONNEES = new URL("../data/steelbooks.json", import.meta.url);
const EXCLUSIONS = new URL("../data/exclusions.json", import.meta.url);
const PAGE = new URL("../steelbook.html", import.meta.url);
const TAG = "antho24kb-21";
const SOURCE = "4k-ultra-hd.fr";
const DESCRIPTION_DEFAUT = "Steelbook 4K, sortie en France.";
const norm = (s) => String(s).normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("fr-FR").replace(/[^\p{Letter}\p{Number}]+/gu, " ").trim();
const slug = (s) => norm(String(s).replace(/['’]/g, "").replace(/&/g, " et ")).replace(/ /g, "-");
const contient = (a, b) => ` ${a} `.includes(` ${b} `) || ` ${b} `.includes(` ${a} `);
const dateExacte = (d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) && new Date(d + "T00:00:00Z").toISOString().slice(0, 10) === d;
const lienRecherche = (titre) => `https://www.amazon.fr/s?k=${norm(titre).split(" ").map(encodeURIComponent).join("%20")}%204K%20steelbook&tag=${TAG}`;
const asinDansLien = (l) => /\/dp\/[A-Z0-9]{10}/.test(l);

const donnees = JSON.parse(await readFile(DONNEES, "utf8"));
// Exclusions d'Antho (introuvables sur Amazon, etc.) : lecture seule, aucune exclusion n'est jamais créée automatiquement.
const EXCLUS = JSON.parse(await readFile(EXCLUSIONS, "utf8")).map((x) => norm(x.titre));
const ops = JSON.parse(await readFile(fichierOps, "utf8"));
if (!Array.isArray(donnees) || !Array.isArray(ops)) { console.error("Les données et les opérations doivent être des tableaux JSON."); process.exit(2); }

const appliques = [], refuses = [];
const refus = (op, raison) => refuses.push({ op, raison });
const cle = (e) => e.date ?? "9999-99-99";
const insererTrie = (e) => { let i = donnees.length; while (i > 0 && cle(donnees[i - 1]) > cle(e)) i--; donnees.splice(i, 0, e); };

for (const op of ops) {
  if (!op || typeof op !== "object") { refus(op, "opération invalide"); continue; }
  if (op.lien !== undefined) { refus(op, "les liens ne sont jamais fournis par la mise à jour automatique (le script crée le lien de recherche, les liens ASIN sont gérés par Antho)"); continue; }

  if (op.op === "ajouter") {
    if (typeof op.titre !== "string" || !op.titre.trim()) { refus(op, "titre manquant"); continue; }
    if (!dateExacte(op.date)) { refus(op, "date exacte AAAA-MM-JJ obligatoire (jamais d'année ou de mois seuls)"); continue; }
    if (op.source !== SOURCE) { refus(op, `source obligatoire : ${SOURCE}`); continue; }
    if (op.amazon !== "O") { refus(op, "Amazon doit valoir O sur la source (2e caractère de l'icône Dispos)"); continue; }
    const t = norm(op.titre);
    const exclu = EXCLUS.find((x) => contient(t, x));
    if (exclu) { refus(op, `produit exclu par Antho (« ${exclu} »)`); continue; }
    const id = slug(op.titre);
    const doublon = donnees.find((e) => e.id === id || contient(norm(e.titre), t));
    if (doublon) { refus(op, `doublon probable de « ${doublon.titre} » (${doublon.id}) : ne pas créer, signaler à Antho`); continue; }
    const description = op.description ?? DESCRIPTION_DEFAUT;
    if (typeof description !== "string" || description.length > 140 || /[<>]/.test(description)) { refus(op, "description invalide (140 caractères maximum, sans HTML)"); continue; }
    const e = { id, date: op.date, titre: op.titre.trim(), lien: lienRecherche(op.titre), description };
    insererTrie(e); appliques.push({ op: "ajouter", id, date: op.date });
  } else if (op.op === "dater") {
    const e = donnees.find((x) => x.id === op.id);
    if (!e) { refus(op, "id inconnu"); continue; }
    if (!dateExacte(op.date)) { refus(op, "date exacte AAAA-MM-JJ obligatoire : une information incomplète ne remplace pas la date actuelle"); continue; }
    if (op.source !== SOURCE) { refus(op, `source obligatoire : ${SOURCE}`); continue; }
    if (e.date === op.date) { refus(op, "date déjà à jour"); continue; }
    if (e.statut_date === "confirmee") { refus(op, `date confirmée (${e.date}) : divergence ${op.date} signalée à Antho, non appliquée`); continue; }
    donnees.splice(donnees.indexOf(e), 1); const ancienne = e.date; e.date = op.date;
    // Jamais « confirmee » automatiquement ; la période n'a plus de sens une fois la date exacte connue.
    e.statut_date = "annoncee"; delete e.periode;
    e.date_sources = [...(e.date_sources || []), { source: SOURCE, valeur: op.date, vu_le: aujourdhui }];
    insererTrie(e);
    appliques.push({ op: "dater", id: e.id, de: ancienne, a: op.date });
  } else if (op.op === "retirer") {
    const e = donnees.find((x) => x.id === op.id);
    if (!e) { refus(op, "id inconnu"); continue; }
    if (op.motif !== "amazon_N" || !/^r-.N/.test(op.icone || "") || op.source !== SOURCE) { refus(op, "retrait refusé : seul le motif amazon_N confirmé par l'icône Dispos (2e caractère N) de la source est accepté ; un produit non détecté n'est jamais supprimé"); continue; }
    if (e.conserver === true) { refus(op, "produit « conserver: true » : jamais retiré automatiquement, signaler à Antho"); continue; }
    if (e.distribution && e.distribution !== "amazon") { refus(op, "produit non Amazon (ex. exclusivité Fnac) : la disponibilité Amazon ne justifie aucun retrait"); continue; }
    if (e.lien && asinDansLien(e.lien)) { refus(op, "lien ASIN vérifié par Antho : ne pas retirer automatiquement, signaler à Antho"); continue; }
    donnees.splice(donnees.indexOf(e), 1); appliques.push({ op: "retirer", id: e.id });
  } else refus(op, "opération inconnue (ajouter, dater ou retirer)");
}

if (appliques.length && !SIMULATION) {
  await writeFile(DONNEES, JSON.stringify(donnees, null, 2));
  const [y, m, d] = aujourdhui.split("-").map(Number);
  const mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"][m - 1];
  const page = await readFile(PAGE, "utf8");
  const maj = page.replace(/Mis à jour le \d{1,2}(?:er)? \p{Letter}+ \d{4}\./u, `Mis à jour le ${d} ${mois} ${y}.`);
  if (maj !== page) await writeFile(PAGE, maj);
}
console.log(JSON.stringify({ modifie: appliques.length > 0 && !SIMULATION, appliques, refuses }, null, 2));
