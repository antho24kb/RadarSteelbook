// Depuis la racine du dépôt : node scripts/build-catalogue.mjs [--check]
// Source unique : data/steelbooks.json. Ce script (re)génère deux zones délimitées par des marqueurs :
//   - steelbook.html : le catalogue (titres de mois + cartes) ;
//   - index.html     : le calendrier lisible sans JavaScript (le JS du hub le remplace ensuite par la vue filtrée).
// Tout ce qui est hors des marqueurs (bloc ALERTE-UNE, en-têtes, pied de page, scripts) n'est jamais touché.
// Après génération, lancer : node scripts/sync-hub.mjs (radar-steelbook.html doit rester une copie exacte d'index.html).
// Avec --check : ne modifie rien, échoue si un fichier n'est pas à jour.
import { readFile, writeFile } from "node:fs/promises";

const CHECK = process.argv.includes("--check");
const DEBUT = "<!-- CATALOGUE-AUTO:DEBUT";
const FIN = "<!-- CATALOGUE-AUTO:FIN -->";
const NOTE = " : zone générée depuis data/steelbooks.json par scripts/build-catalogue.mjs. Ne pas modifier à la main. -->";

const MOIS_LONG = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const MOIS_COURT = ["janv", "févr", "mars", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"];

const entries = JSON.parse(await readFile(new URL("../data/steelbooks.json", import.meta.url), "utf8"));
if (!Array.isArray(entries) || !entries.length) { console.error("Erreur : data/steelbooks.json est vide ou invalide."); process.exit(1); }
// Trois rendus de date : confirmee (ou statut absent) = date normale ; annoncee = date + « Date annoncée » ; a_confirmer (date null) = « Date à confirmer · période ».
// Les produits à date null sont placés en dernier groupe. Tri stable : le résultat ne dépend ni de la date du jour ni de l'ordre d'exécution.
const items = entries.map((e, i) => ({ e, i })).sort((a, b) => (a.e.date === null ? 1 : 0) - (b.e.date === null ? 1 : 0) || (a.e.date ?? "").localeCompare(b.e.date ?? "") || a.i - b.i).map((x) => x.e);

const txt = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const attr = (s) => txt(s).replace(/"/g, "&quot;");
const parts = (date) => { const [y, m, d] = date.split("-").map(Number); return { y, m: m - 1, d }; };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// Catalogue : les liens de recherche gardent l'écriture historique (« + » pour les espaces).
const hrefCatalogue = (lien) => attr(lien.includes("/s?k=") ? lien.replace(/%20/g, "+") : lien);

const anneePeriode = (e) => (e.periode ? e.periode.slice(0, 4) : "");
const etiquetteDate = (e) => (e.statut_date === "annoncee" ? "Date annoncée" : e.statut_date === "a_confirmer" ? `Date à confirmer${e.periode ? " · " + e.periode : ""}` : "");
const fnac = (e) => e.distribution === "fnac_exclusif";

function groupes() {
  const g = [];
  for (const e of items) {
    const cle = e.date ? e.date.slice(0, 7) : "a-confirmer";
    let last = g[g.length - 1];
    if (!last || last.cle !== cle) { last = { cle, items: [] }; g.push(last); }
    last.items.push(e);
  }
  return g;
}
const nomGroupe = (cle) => { if (cle === "a-confirmer") return "Date à confirmer"; const { y, m } = parts(cle + "-15"); return `${MOIS_LONG[m]} ${y}`; };

function zoneCatalogue() {
  const out = [];
  for (const g of groupes()) {
    out.push(`<h2 style="margin:28px 0 12px">${cap(nomGroupe(g.cle))}</h2>`);
    for (const e of g.items) {
      const tag = e.date ? (({ y, m, d }) => `${d} ${MOIS_LONG[m]} ${y}`)(parts(e.date)) : etiquetteDate(e);
      out.push(
        `<section class="card" data-id="${attr(e.id)}">`,
        `<div class="tag">${txt(tag)}</div>`,
        `<h2>${txt(e.titre)}</h2>`,
        ...(e.description ? [`<p>${txt(e.description)}</p>`] : []),
        ...(e.date && e.statut_date === "annoncee" ? [`<p class="statut">Date annoncée</p>`] : []),
        fnac(e) ? `<p class="excl">Exclusivité Fnac</p>` : `<a class="btn" href="${hrefCatalogue(e.lien)}" rel="sponsored nofollow noopener">Voir sur Amazon</a>`,
        `</section>`
      );
    }
  }
  return out.join("\n");
}

function zoneHub() {
  const out = [];
  for (const g of groupes()) {
    const n = g.items.length;
    out.push(`<details class="mois-bloc" open>`, `<summary><span class="nom">${nomGroupe(g.cle)}</span><span class="nb">${n} ${n > 1 ? "sorties" : "sortie"}</span></summary>`);
    for (const e of g.items) {
      const jour = e.date ? (({ m, d }) => `<b>${d}</b><span>${MOIS_COURT[m]}</span>`)(parts(e.date)) : `<b>?</b><span>${anneePeriode(e)}</span>`;
      const dateTxt = e.date ? (({ m, d }) => `${d} ${MOIS_LONG[m]}`)(parts(e.date)) : "";
      const lab = etiquetteDate(e);
      // Vignette : image locale si elle existe, sinon cadre vide (alignement identique pour toutes les lignes).
      const vig = e.image ? `<img class="vig" src="${attr(e.image)}" alt="" width="54" height="54" loading="lazy" decoding="async">` : `<span class="vig"></span>`;
      out.push(
        `<div class="sb" data-id="${attr(e.id)}"><div class="jour">${jour}</div>${vig}` +
        `<div class="txt"><div class="titre">${txt(e.titre)}</div><div class="date">${dateTxt}</div>${lab ? `<div class="statut">${txt(lab)}</div>` : ""}</div>` +
        (fnac(e) ? `<span class="excl">Exclusivité Fnac</span></div>` : `<a class="bouton" target="_blank" rel="noopener sponsored" href="${attr(e.lien)}">Amazon</a></div>`)
      );
    }
    out.push(`</details>`);
  }
  return out.join("\n");
}

// Contrôles de position : la zone doit être au bon endroit, une seule fois, et rien d'autre ne doit changer.
function remplacer(html, zone, nom) {
  const a = html.indexOf(DEBUT);
  const b = html.indexOf(FIN);
  if (a < 0 || b < 0 || b < a || html.indexOf(DEBUT, a + 1) >= 0 || html.indexOf(FIN, b + 1) >= 0) {
    throw new Error(`${nom} : marqueurs CATALOGUE-AUTO:DEBUT / FIN absents, dupliqués ou dans le mauvais ordre.`);
  }
  const alerteDeb = html.indexOf("<!-- ALERTE-UNE");
  const alerteFin = html.indexOf("<!-- /ALERTE-UNE -->");
  if (alerteDeb >= 0 && alerteFin >= 0 && a < alerteFin + 20 && b > alerteDeb) {
    throw new Error(`${nom} : les marqueurs ne doivent pas toucher le bloc manuel ALERTE-UNE.`);
  }
  if (nom === "steelbook.html") {
    const pied = html.indexOf("<footer");
    if (alerteFin < 0 || a < alerteFin || pied < 0 || b > pied) throw new Error(`${nom} : la zone générée doit se trouver après <!-- /ALERTE-UNE --> et avant <footer>.`);
  } else {
    const o = html.indexOf('<div id="liste">');
    if (o < 0 || html.slice(o + 16, a).trim() !== "" || !/^\s*<\/div>/.test(html.slice(b + FIN.length))) throw new Error(`${nom} : la zone générée doit occuper tout l'intérieur de <div id="liste">.`);
  }
  const apres = html.slice(0, a) + `${DEBUT}${NOTE}\n` + zone + "\n" + html.slice(b);
  // Auto-contrôle : tout ce qui est hors de la zone est identique octet pour octet.
  const b2 = apres.indexOf(FIN);
  if (apres.slice(0, a) !== html.slice(0, a) || apres.slice(b2) !== html.slice(b)) throw new Error(`${nom} : le contenu hors zone aurait été modifié.`);
  return apres;
}

const cibles = [
  { fichier: "../steelbook.html", nom: "steelbook.html", zone: zoneCatalogue() },
  { fichier: "../index.html", nom: "index.html", zone: zoneHub() },
];
let ecart = 0;
for (const c of cibles) {
  const url = new URL(c.fichier, import.meta.url);
  const avant = await readFile(url, "utf8");
  let apres;
  try { apres = remplacer(avant, c.zone, c.nom); } catch (err) { console.error("Erreur : " + err.message); process.exit(1); }
  if (apres !== avant) {
    ecart++;
    if (CHECK) console.error(`${c.nom} : la zone générée n'est pas à jour (lancer node scripts/build-catalogue.mjs puis node scripts/sync-hub.mjs).`);
    else { await writeFile(url, apres); console.log(`${c.nom} : zone régénérée (${items.length} produits).`); }
  } else console.log(`${c.nom} : déjà à jour (${items.length} produits).`);
}
if (CHECK && ecart) process.exit(1);
