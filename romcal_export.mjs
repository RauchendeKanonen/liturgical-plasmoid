#!/usr/bin/env node

import fs from "fs";
import { Romcal } from "romcal";

function getArg(name, def = null) {
  const idx = process.argv.indexOf(name);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : def;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function firstOrEmpty(v) {
  if (Array.isArray(v)) return v[0] || "";
  return v || "";
}

function normalizeColor(v) {
  return firstOrEmpty(v).toString().toLowerCase();
}

function normalizeSeason(e) {
  return firstOrEmpty(e.seasonNames) || firstOrEmpty(e.seasons) || "";
}

function normalizeRank(e) {
  return e.rankName || e.rank || "";
}

function sanitizeVarName(s) {
  return s.replace(/[^A-Za-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
}

function usage() {
  console.log(`
Usage:
  node romcal_export.mjs --year 2026 --package @romcal/calendar.germany --export Germany_De --output litcal_de_2026.js

Optional:
  --locale de
  --var DATA_DE_2026
  --list-exports
  --verbose
`);
}

const year = parseInt(getArg("--year", "2026"), 10);
const locale = getArg("--locale", "de");
const pkgName = getArg("--package", "@romcal/calendar.germany");
const exportName = getArg("--export", null);
const output = getArg("--output", `litcal_${year}.js`);
const explicitVar = getArg("--var", null);
const listExports = hasFlag("--list-exports");
const verbose = hasFlag("--verbose");

if (!year || !pkgName) {
  usage();
  process.exit(1);
}

let mod;
try {
  mod = await import(pkgName);
} catch (e) {
  console.error("Fehler beim Laden des Kalenderpakets:", e?.message || e);
  process.exit(1);
}

const availableExports = Object.keys(mod).sort();

if (listExports) {
  console.log("Verfügbare Exporte in", pkgName);
  for (const k of availableExports) console.log(" -", k);
  process.exit(0);
}

let calendarDef = null;

if (exportName) {
  calendarDef = mod[exportName];
  if (!calendarDef) {
    console.error(`Export "${exportName}" nicht gefunden in ${pkgName}.`);
    console.error("Verfügbare Exporte:", availableExports.join(", "));
    process.exit(1);
  }
} else if (mod.default) {
  calendarDef = mod.default;
  if (verbose) {
    console.log("Verwende default-Export aus", pkgName);
  }
} else {
  console.error(`Bitte --export angeben. ${pkgName} hat keinen default-Export.`);
  console.error("Verfügbare Exporte:", availableExports.join(", "));
  process.exit(1);
}

let romcal;
try {
  romcal = new Romcal({
    localizedCalendar: calendarDef,
    locale,
  });
} catch (e) {
  console.error("Fehler beim Initialisieren von romcal:", e?.message || e);
  process.exit(1);
}

let cal;
try {
  cal = await romcal.generateCalendar(year);
} catch (e) {
  console.error("Fehler bei generateCalendar:", e?.message || e);
  process.exit(1);
}

// romcal v3-Doku beschreibt ein Array von LiturgicalDay-Objekten.
// Manche Kalender-/Build-Kombinationen liefern aber auch date-keyed Objekte.
// Beides robust unterstützen.
const result = [];

function pushEntry(date, e) {
  result.push({
    date: date || e.date || "",
    title: e.name || e.title || "",
    rank: normalizeRank(e),
    season: normalizeSeason(e),
    color: normalizeColor(e.colors || e.color),
    description: e.description || "",
    event_key: e.key || e.event_key || "",
  });
}

if (Array.isArray(cal)) {
  for (const e of cal) {
    pushEntry(e.date || "", e);
  }
} else if (cal && typeof cal === "object") {
  for (const [date, entries] of Object.entries(cal)) {
    if (Array.isArray(entries)) {
      for (const e of entries) pushEntry(date, e);
    } else if (entries && typeof entries === "object") {
      pushEntry(date, entries);
    }
  }
} else {
  console.error("Unerwartetes Ausgabeformat von romcal.");
  process.exit(1);
}

// Leere/kaputte Einträge etwas aufräumen
const cleaned = result
  .filter(e => e.date && e.title)
  .sort((a, b) => {
    if (a.date < b.date) return -1;
    if (a.date > b.date) return 1;
    if (a.rank < b.rank) return -1;
    if (a.rank > b.rank) return 1;
    return a.title.localeCompare(b.title);
  });

const varName =
  explicitVar ||
  sanitizeVarName(
    `DATA`
  ).toUpperCase();

const content =
`.pragma library

var ${varName} = ${JSON.stringify(cleaned, null, 2)};
`;

fs.writeFileSync(output, content, "utf-8");

console.log("✔ Export geschrieben:", output);
console.log("Einträge:", cleaned.length);
console.log("Variable:", varName);

if (verbose && cleaned.length > 0) {
  console.log("Erster Eintrag:");
  console.log(JSON.stringify(cleaned[0], null, 2));
}
