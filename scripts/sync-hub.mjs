// Depuis la racine du dépôt : node scripts/sync-hub.mjs
// index.html est la page d'accueil (hub Radar Steelbook). radar-steelbook.html en est une copie exacte
// (ancienne adresse conservée pour TikTok, le flux RSS et les pages de remerciement).
// On modifie TOUJOURS index.html, puis on lance ce script.
import { readFile, writeFile } from "node:fs/promises";
const hub = await readFile(new URL("../index.html", import.meta.url), "utf8");
if (!hub.includes("HUB-RADAR")) { console.error("Erreur : index.html n'est pas le hub Radar (marqueur HUB-RADAR absent). Rien n'a été copié."); process.exit(1); }
await writeFile(new URL("../radar-steelbook.html", import.meta.url), hub);
console.log("radar-steelbook.html synchronisé avec index.html");
