# liturgical-plasmoid

## Overview

**liturgical-plasmoid** is a KDE Plasma 6 widget that displays a Catholic liturgical calendar, paired with a Python/Qt helper application for fetching or exporting country-specific calendar data.

The repository combines:
- a Plasma plasmoid,
- JavaScript data files,
- a Python helper tool,
- a Node/romcal-based export pipeline.

## Top-level contents

- `org.example.liturgicalcalendar/`
- `README.md`
- `README_romcal_exporter.txt`
- `lh_edit.py`
- `litcal_de_2026.js`
- `litcal_hr_2026.js`
- `package.json`
- `package-lock.json`
- `romcal_export.mjs`
- `node_modules/`

## What this project appears to do

### Plasma widget
The `org.example.liturgicalcalendar` folder suggests a standard plasmoid package containing the UI and runtime logic.

### Liturgical calendar data
The `litcal_de_2026.js` and `litcal_hr_2026.js` files suggest country-specific exported datasets.

### Export pipeline
`romcal_export.mjs` and the Node package files indicate a JavaScript-based export process, likely using romcal or a related calendar library.

### Desktop helper tool
`lh_edit.py` suggests a Python/PyQt helper utility to configure or trigger data export.

## Installation

A likely development setup includes both Python and Node components.

### Node dependencies

```bash
npm install
```

### Python helper

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install PyQt6
```

## Running

Exporter:

```bash
node romcal_export.mjs
```

Helper tool:

```bash
python3 lh_edit.py
```

## Suggested architecture

```text
calendar source / romcal
    ↓
Node export script
    ↓
JS data files
    ↓
Plasma QML/JS backend
    ↓
Rendered widget
```

## Notes the README should add

- supported countries,
- how to regenerate data,
- how the helper tool interacts with the widget,
- Plasma 6 installation steps,
- troubleshooting for cached QML/JS data.

## License

No visible license from the public top-level snapshot.
