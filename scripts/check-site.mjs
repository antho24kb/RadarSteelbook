// Depuis la racine du dépôt : node scripts/check-site.mjs [--base=<référence git>]   (code de sortie 1 si une règle est violée)
// Les contrôles fonctionnels (canonical, hub, GA4, Brevo, liens, affiliation, prix, catalogue) ne dépendent d'aucune référence.
// Avec --base=<référence> (branche, tag ou SHA ; ou variable CHECK_BASE), on ajoute les contrôles de comparaison :
// le hub et le guide sont comparés aux pages de cette version, et les fichiers protégés doivent être inchangés depuis elle.
// Sans --base, ces contrôles de comparaison sont simplement ignorés (ils n'ont de sens que pour une migration).
import { readFile, access } from "node:fs/promises";
import { execFileSync } from "node:child_process";
const BASE = "https://antho24kb.github.io/RadarSteelbook/";
const read = (p) => readFile(new URL("../" + p, import.meta.url), "utf8");
const errors = []; const ok = [];
const arg = process.argv.slice(2).find((a) => a.startsWith("--base=")) ?? (process.argv.includes("--base") ? "--base=" + process.argv[process.argv.indexOf("--base") + 1] : null);
const BASE_REF = arg ? arg.slice(7) : (process.env.CHECK_BASE || null);
if (BASE_REF) {
  try { execFileSync("git", ["rev-parse", "--verify", "--quiet", BASE_REF + "^{commit}"], { stdio: "ignore" }); }
  catch { console.error(`Erreur : la référence « ${BASE_REF} » n'existe pas (branche, tag ou SHA attendu).`); process.exit(2); }
}
const baseFile = (p) => execFileSync("git", ["show", `${BASE_REF}:${p}`], { encoding: "utf8" });
const check = (cond, msg) => (cond ? ok.push(msg) : errors.push(msg));
const pages = ["index.html", "radar-steelbook.html", "cadeaux-collectionneurs.html", "steelbook.html", "psycho.html", "liste.html", "merci-liste.html", "p/index.html", "s/index.html"];
const html = {}; for (const p of pages) html[p] = await read(p);

// 1. Hub protégé
const hub = html["index.html"];
check(hub.includes("HUB-RADAR"), "index.html : marqueur HUB-RADAR présent");
check(/<title>Radar Steelbook<\/title>/.test(hub) && !hub.includes("Guide cadeaux collectionneurs</h1>"), "index.html : c'est bien le hub Radar (pas le guide cadeaux)");
check(hub === html["radar-steelbook.html"], "radar-steelbook.html : copie exacte de index.html");

// 2. Canonical
const canon = (p) => (html[p].match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
check(canon("index.html") === BASE, "canonical index.html = racine du site");
check(canon("radar-steelbook.html") === BASE, "canonical radar-steelbook.html = racine du site");
check(canon("cadeaux-collectionneurs.html") === BASE + "cadeaux-collectionneurs.html", "canonical cadeaux-collectionneurs.html = elle-même");
check(canon("p/index.html") === BASE + "psycho.html" && canon("s/index.html") === BASE + "steelbook.html", "redirections /p/ et /s/ : canonical inchangées");
for (const p of ["index.html", "cadeaux-collectionneurs.html"]) check((html[p].match(/rel="canonical"/g) || []).length === 1, p + " : une seule canonical");

// 3. Fonctions du hub conservées (comparées à la version actuellement publiée)
for (const [label, re] of [
  ["GA4 (G-F6GG3ZWCWC)", /gtag\("config", "G-F6GG3ZWCWC"\)/], ["GoatCounter", /data-goatcounter=/], ["suivi amazon_click", /gtag\("event", "amazon_click"/],
  ["formulaire mail Brevo", /sibforms\.com/], ["flux RSS", /type="application\/rss\+xml"/], ["filtres du calendrier", /data-f="avenir"[\s\S]*data-f="dispo"/],
  ["chargement data/steelbooks.json", /fetch\("data\/steelbooks\.json"\)/], ["bloc ALERTE-UNE", /<!-- ALERTE-UNE/], ["bons plans", /const BONS_PLANS/],
]) check(re.test(hub), "hub : " + label);
const strip = (s) => s.replace(/<!-- HUB-RADAR[^>]*-->\n?/, "").replace(/<link rel="canonical"[^>]*>\n?/, "").replace(/<meta property="og:url"[^>]*>\n?/, "").replace(/ *<p><a href="steelbook\.html" style="color:inherit">[^\n]*<\/p>\n/, "");
if (BASE_REF) check(strip(hub) === baseFile("radar-steelbook.html"), `hub : aucune autre différence avec radar-steelbook.html de ${BASE_REF} (contenu, alertes, scripts)`);

// 4. Guide cadeaux conservé
const guide = html["cadeaux-collectionneurs.html"];
check(/<title>Guide cadeaux collectionneurs<\/title>/.test(guide) && /<h1>Guide cadeaux collectionneurs<\/h1>/.test(guide) && guide.includes('href="index.html">← Radar Steelbook</a>'), "cadeaux-collectionneurs.html : c'est bien le guide cadeaux, avec son lien retour vers le hub");
if (BASE_REF) {
  const g = guide.replace(/<link rel="canonical"[^>]*>\n?/, "").replace('<p><a href="index.html">← Radar Steelbook</a></p>\n', "");
  check(g === baseFile("index.html"), `cadeaux-collectionneurs.html : contenu identique à index.html de ${BASE_REF} (+ canonical et lien retour)`);
}

// 5. Liens locaux
let broken = 0;
for (const p of pages) {
  const dir = p.includes("/") ? p.slice(0, p.lastIndexOf("/") + 1) : "";
  for (const m of html[p].replace(/<!--[\s\S]*?-->/g, "").matchAll(/(?:href|src|action)="([^"#?]+)(?:[#?][^"]*)?"/g)) {
    const u = m[1]; if (/^(https?:|\/\/|mailto:|data:|javascript:)/.test(u)) continue;
    const path = new URL(dir + u, "http://x/").pathname.slice(1) || "index.html";
    try { await access(new URL("../" + (path.endsWith("/") ? path + "index.html" : path), import.meta.url)); } catch { broken++; errors.push(`lien cassé dans ${p} : ${u}`); }
  }
}
check(broken === 0, "liens locaux : tous les fichiers cibles existent");
check(html["steelbook.html"].includes('href="cadeaux-collectionneurs.html"') && html["psycho.html"].includes('href="cadeaux-collectionneurs.html"'), "steelbook.html et psycho.html pointent vers cadeaux-collectionneurs.html");
check(!pages.some((p) => /href="index\.html">Voir aussi/.test(html[p])), "plus aucun « Voir aussi le guide » vers index.html");

// 6. Affiliation et règles
for (const p of ["index.html", "cadeaux-collectionneurs.html", "steelbook.html"]) {
  for (const m of html[p].matchAll(/<a\b[^>]*href="([^"]*(?:amazon\.|link\.amazon|amzn\.))[^"]*"[^>]*>/g)) {
    if (!/rel="[^"]*sponsored/.test(m[0])) errors.push(`${p} : lien Amazon sans rel="sponsored" : ${m[0].slice(0, 90)}`);
  }
}
check(!errors.some((e) => e.includes('sans rel="sponsored"')), "liens Amazon : tous en rel=\"sponsored\"");
check(/Partenaire Amazon/.test(hub) && /Partenaire Amazon/.test(html["cadeaux-collectionneurs.html"]), "mention Partenaire Amazon présente (hub et guide)");
const price = /(?:[€$£]\s?\d|\d[\d\s]*(?:[.,]\d{1,2})?\s?[€$£]|\b\d[\d\s]*(?:[.,]\d{1,2})?\s?(?:EUR|euros?)\b)/i;
const body = (s) => s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "");
for (const p of ["index.html", "cadeaux-collectionneurs.html"]) check(!price.test(body(html[p])), p + " : aucun prix affiché");

// 7. Catalogue et flux inchangés
try { execFileSync("node", ["scripts/validate-steelbooks.mjs"], { encoding: "utf8" }); ok.push("catalogue data/steelbooks.json : validateur OK"); } catch (e) { errors.push("validate-steelbooks : " + (e.stdout || e.message)); }
try { execFileSync("node", ["scripts/build-catalogue.mjs", "--check"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); ok.push("catalogue : zones générées de steelbook.html et index.html à jour avec data/steelbooks.json"); } catch (e) { errors.push("build-catalogue --check : " + (e.stderr || e.stdout || e.message)); }
{
  const ids = JSON.parse(await read("data/steelbooks.json")).map((e) => e.id).sort().join();
  const dataIds = (h) => [...h.matchAll(/<(?:section|div) class="(?:card|sb)" data-id="([^"]+)"/g)].map((m) => m[1]);
  const sbIds = dataIds(html["steelbook.html"]), hubIds = dataIds(hub);
  check(sbIds.slice().sort().join() === ids && new Set(sbIds).size === sbIds.length, "steelbook.html : une carte générée par produit du JSON, data-id uniques");
  check(hubIds.slice().sort().join() === ids && new Set(hubIds).size === hubIds.length, "index.html : un élément de calendrier par produit du JSON, data-id uniques");
}
if (BASE_REF) {
  const feedChanged = execFileSync("git", ["diff", "--name-only", BASE_REF, "--", "feed.xml", "data/steelbooks.json", "alertes", ".github"], { encoding: "utf8" }).trim();
  check(feedChanged === "", `feed.xml, data/, alertes/, .github/ : non modifiés depuis ${BASE_REF}`);
}

console.log(BASE_REF ? `Référence de comparaison : ${BASE_REF}` : "Aucune référence de comparaison (--base absent) : contrôles de comparaison ignorés");
console.log(ok.map((m) => "OK   " + m).join("\n")); if (errors.length) console.log(errors.map((m) => "ERREUR " + m).join("\n"));
console.log(`\n${ok.length} contrôles OK, ${errors.length} erreur(s)`); process.exit(errors.length ? 1 : 0);
