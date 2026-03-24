# Romcal → JS Exporter

## Dateien
- `liturgical_exporter_pyqt.py` – kleine PyQt6-Oberfläche
- `romcal_export.mjs` – Node-Skript, das romcal aufruft und eine JS-Datei schreibt

## Setup
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install PyQt6

npm install romcal@dev @romcal/calendar.germany@dev
```

Für andere Länder zusätzlich das jeweilige romcal-Kalenderpaket installieren.

## Start
```bash
python liturgical_exporter_pyqt.py
```

## Direkt ohne GUI
```bash
node romcal_export.mjs \
  --year 2026 \
  --locale de \
  --package @romcal/calendar.germany \
  --output ./litcal_de_2026.js
```

## Hinweise
- romcal v3 ist laut Projekt noch im `dev`/Beta-Status.
- Der Exportname des Kalenderpakets kann sich je nach Paket unterscheiden. Das Skript versucht automatisch, einen passenden Export auszuwählen.
- Falls ein Paket mehrere passende Exporte anbietet, kann in der GUI oder per `--export-name` ein bestimmter Export erzwungen werden.
