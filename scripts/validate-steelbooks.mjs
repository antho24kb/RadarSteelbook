// Depuis la racine du dépôt : node scripts/validate-steelbooks.mjs
// Valide data/steelbooks.json (source unique des produits) et data/exclusions.json (exclusions éditoriales d'Antho).
import { readFile } from "node:fs/promises";

const entries = JSON.parse(await readFile(new URL("../data/steelbooks.json", import.meta.url), "utf8"));
const exclusions = JSON.parse(await readFile(new URL("../data/exclusions.json", import.meta.url), "utf8"));
const errors = [];
const seenTitles = new Set();
const seenLinks = new Set();
const seenIds = new Set();
const seenNormTitles = new Set();
const seenAsins = new Set();
// id et titre obligatoires ; date obligatoire (null seulement si statut_date vaut a_confirmer) ; lien obligatoire sauf distribution fnac_exclusif.
const allowedKeys = ["id", "titre", "date", "lien", "description", "statut_date", "periode", "distribution", "conserver", "conserver_motif", "date_sources"];
const statuts = ["confirmee", "annoncee", "a_confirmer"];
const distributions = ["amazon", "fnac_exclusif"];
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const asinPattern = /^[A-Z0-9]{10}$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const periodePattern = /^\d{4}(?:-\d{2})?$/;
const pricePattern = /(?:[€$£]\s?\d[\d\s]*(?:[.,]\d{1,2})?|\d[\d\s]*(?:[.,]\d{1,2})?\s?[€$£]|\b\d[\d\s]*(?:[.,]\d{1,2})?\s?(?:EUR|USD|GBP|euros?|dollars?|livres?)\b)/i;
const allowedHosts = new Set(["amazon.fr", "www.amazon.fr", "link.amazon", "amzn.to", "amzn.eu"]);

if (!Array.isArray(entries)) {
  console.error("Erreur : le catalogue doit être un tableau JSON.");
  process.exit(1);
}

function normalizeTitle(title) {
  return title
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr-FR")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim();
}
function dateValide(value) {
  if (typeof value !== "string" || !datePattern.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

for (const [index, entry] of entries.entries()) {
  const row = index + 1;
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    errors.push(`Ligne ${row} : chaque entrée doit être un objet.`);
    continue;
  }

  const keys = Object.keys(entry);
  const missing = ["id", "titre", "date"].filter((k) => !keys.includes(k));
  const unknown = keys.filter((k) => !allowedKeys.includes(k));
  if (missing.length || unknown.length) {
    errors.push(`Ligne ${row} : champs obligatoires id, titre, date ; autres autorisés : ${allowedKeys.filter((k) => !["id", "titre", "date"].includes(k)).join(", ")} (manquants : ${missing.join(", ") || "aucun"} ; inconnus : ${unknown.join(", ") || "aucun"}).`);
  }

  if (typeof entry.id !== "string" || !idPattern.test(entry.id)) {
    errors.push(`Ligne ${row} : id invalide (minuscules, chiffres et tirets, ex. « coffret-horreur-80s »).`);
  } else {
    if (seenIds.has(entry.id)) errors.push(`Ligne ${row} : id dupliqué (« ${entry.id} »).`);
    seenIds.add(entry.id);
  }

  // Statut de la date : absent = comportement historique (date normale).
  const statut = entry.statut_date;
  if (statut !== undefined && !statuts.includes(statut)) errors.push(`Ligne ${row} : statut_date invalide (${statuts.join(", ")}).`);
  if (statut === "a_confirmer") {
    if (entry.date !== null) errors.push(`Ligne ${row} : une date à confirmer doit avoir date: null.`);
  } else if (!dateValide(entry.date)) {
    errors.push(`Ligne ${row} : date invalide, format attendu AAAA-MM-JJ (null seulement avec statut_date « a_confirmer »).`);
  }
  if (entry.periode !== undefined) {
    if (statut !== "a_confirmer") errors.push(`Ligne ${row} : periode réservée aux dates à confirmer.`);
    else if (typeof entry.periode !== "string" || !periodePattern.test(entry.periode)) errors.push(`Ligne ${row} : periode invalide (AAAA ou AAAA-MM).`);
  }

  if (entry.date_sources !== undefined) {
    if (!Array.isArray(entry.date_sources)) errors.push(`Ligne ${row} : date_sources doit être une liste.`);
    else {
      for (const src of entry.date_sources) {
        const ok = src && typeof src === "object" && !Array.isArray(src)
          && typeof src.source === "string" && src.source.trim()
          && (src.valeur === null || dateValide(src.valeur))
          && dateValide(src.vu_le)
          && Object.keys(src).every((k) => ["source", "valeur", "url", "vu_le", "note"].includes(k))
          && (src.url === undefined || (typeof src.url === "string" && src.url.startsWith("https://")))
          && (src.note === undefined || typeof src.note === "string");
        if (!ok) { errors.push(`Ligne ${row} : date_sources invalide (source, valeur ou null, vu_le, url et note facultatives).`); break; }
        if (pricePattern.test(`${src.source} ${src.note || ""}`)) { errors.push(`Ligne ${row} : un prix ne doit pas apparaître dans les sources de date.`); break; }
      }
    }
  }

  if (entry.conserver !== undefined && typeof entry.conserver !== "boolean") errors.push(`Ligne ${row} : conserver doit valoir true ou false.`);
  if (entry.conserver === true && (typeof entry.conserver_motif !== "string" || !entry.conserver_motif.trim())) errors.push(`Ligne ${row} : conserver_motif obligatoire quand conserver vaut true.`);
  if (entry.conserver_motif !== undefined && entry.conserver !== true) errors.push(`Ligne ${row} : conserver_motif sans conserver: true.`);

  if (entry.description !== undefined) {
    if (typeof entry.description !== "string" || !entry.description.trim()) {
      errors.push(`Ligne ${row} : la description ne peut pas être vide.`);
    } else if (entry.description.length > 140) {
      errors.push(`Ligne ${row} : description trop longue (140 caractères maximum).`);
    } else if (/[<>]/.test(entry.description)) {
      errors.push(`Ligne ${row} : la description ne doit pas contenir de HTML.`);
    }
  }

  if (typeof entry.titre !== "string" || !entry.titre.trim()) {
    errors.push(`Ligne ${row} : le titre ne peut pas être vide.`);
  } else {
    const titleKey = `${entry.date}\0${normalizeTitle(entry.titre)}`;
    if (seenTitles.has(titleKey)) errors.push(`Ligne ${row} : doublon de titre et de date (« ${entry.titre} »).`);
    seenTitles.add(titleKey);
    const normKey = normalizeTitle(entry.titre);
    if (seenNormTitles.has(normKey)) errors.push(`Ligne ${row} : titre déjà présent à une autre date (« ${entry.titre} »).`);
    seenNormTitles.add(normKey);
  }

  if (entry.distribution !== undefined && !distributions.includes(entry.distribution)) errors.push(`Ligne ${row} : distribution invalide (${distributions.join(", ")}).`);
  if (entry.distribution === "fnac_exclusif") {
    // Exclusivité Fnac : jamais de lien (aucun lien affilié Fnac n'est inventé, aucun bouton Amazon).
    if (entry.lien !== undefined) errors.push(`Ligne ${row} : une exclusivité Fnac n'a pas de lien.`);
  } else if (typeof entry.lien !== "string" || !entry.lien.trim()) {
    errors.push(`Ligne ${row} : le lien Amazon ne peut pas être vide.`);
  } else {
    try {
      const url = new URL(entry.lien);
      if (url.protocol !== "https:" || !allowedHosts.has(url.hostname.toLowerCase())) {
        errors.push(`Ligne ${row} : le lien doit pointer vers Amazon.`);
      } else if ((url.hostname === "amazon.fr" || url.hostname === "www.amazon.fr") && url.searchParams.get("tag") !== "antho24kb-21") {
        errors.push(`Ligne ${row} : le lien Amazon doit conserver le tag partenaire.`);
      }
      if (seenLinks.has(url.href)) errors.push(`Ligne ${row} : lien dupliqué.`);
      seenLinks.add(url.href);
      const asinMatch = url.pathname.match(/\/dp\/([^/?#]+)/);
      if (asinMatch) {
        if (!asinPattern.test(asinMatch[1])) errors.push(`Ligne ${row} : ASIN invalide (« ${asinMatch[1]} »).`);
        else if (seenAsins.has(asinMatch[1])) errors.push(`Ligne ${row} : ASIN déjà utilisé par une autre entrée (${asinMatch[1]}).`);
        seenAsins.add(asinMatch[1]);
      }
    } catch {
      errors.push(`Ligne ${row} : URL invalide.`);
    }
  }

  for (const key of ["titre", "description", "periode", "conserver_motif"]) {
    if (typeof entry[key] === "string" && pricePattern.test(entry[key])) {
      errors.push(`Ligne ${row} : un prix ne doit pas apparaître dans le catalogue.`);
      break;
    }
  }
}

// Exclusions éditoriales (data/exclusions.json) : lues par la mise à jour automatique, jamais écrites par elle.
if (!Array.isArray(exclusions)) errors.push("exclusions.json : doit être un tableau JSON.");
else {
  const vus = new Set();
  for (const [i, x] of exclusions.entries()) {
    const ok = x && typeof x === "object" && ["titre", "motif", "decide_par", "reference"].every((k) => typeof x[k] === "string" && x[k].trim())
      && Object.keys(x).every((k) => ["titre", "motif", "decide_par", "reference"].includes(k));
    if (!ok) { errors.push(`exclusions.json, ligne ${i + 1} : titre, motif, decide_par et reference obligatoires.`); continue; }
    const cle = normalizeTitle(x.titre);
    if (vus.has(cle)) errors.push(`exclusions.json, ligne ${i + 1} : exclusion dupliquée (« ${x.titre} »).`);
    vus.add(cle);
    if (seenNormTitles.has(cle)) errors.push(`exclusions.json, ligne ${i + 1} : « ${x.titre} » est exclu mais présent dans le catalogue.`);
  }
}

if (errors.length) {
  console.error(`Validation échouée (catalogue : ${entries.length} entrées) :`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Catalogue valide : ${entries.length} steelbooks vérifiés (${exclusions.length} exclusions).`);
}
