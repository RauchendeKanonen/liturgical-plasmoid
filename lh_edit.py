#!/usr/bin/env python3
import json
import os
import shlex
import subprocess
import sys
from pathlib import Path

from PyQt6.QtCore import Qt
from PyQt6.QtWidgets import (
    QApplication,
    QCheckBox,
    QComboBox,
    QFileDialog,
    QGridLayout,
    QGroupBox,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QMainWindow,
    QMessageBox,
    QPushButton,
    QPlainTextEdit,
    QSpinBox,
    QVBoxLayout,
    QWidget,
)

COUNTRY_TO_PACKAGE = {
    "DE": "@romcal/calendar.germany",
    "AT": "@romcal/calendar.austria",
    "CH": "@romcal/calendar.switzerland",
    "FR": "@romcal/calendar.france",
    "IT": "@romcal/calendar.italy",
    "NL": "@romcal/calendar.netherlands",
    "BE": "@romcal/calendar.belgium",
    "LU": "@romcal/calendar.luxembourg",
    "ES": "@romcal/calendar.spain",
    "PT": "@romcal/calendar.portugal",
    "PL": "@romcal/calendar.poland",
    "CZ": "@romcal/calendar.czech-republic",
    "SK": "@romcal/calendar.slovakia",
    "HU": "@romcal/calendar.hungary",
    "SI": "@romcal/calendar.slovenia",
    "HR": "@romcal/calendar.croatia",
    "IE": "@romcal/calendar.ireland",
    "EN": "@romcal/calendar.england",
    "WA": "@romcal/calendar.wales",
    "SC": "@romcal/calendar.scotland",
    "US": "@romcal/calendar.usa",
}

COUNTRY_OPTIONS = [
    ("DE - Germany", "DE"),
    ("AT - Austria", "AT"),
    ("CH - Switzerland", "CH"),
    ("FR - France", "FR"),
    ("IT - Italy", "IT"),
    ("NL - Netherlands", "NL"),
    ("BE - Belgium", "BE"),
    ("LU - Luxembourg", "LU"),
    ("ES - Spain", "ES"),
    ("PT - Portugal", "PT"),
    ("PL - Poland", "PL"),
    ("CZ - Czech Republic", "CZ"),
    ("SK - Slovakia", "SK"),
    ("HU - Hungary", "HU"),
    ("SI - Slovenia", "SI"),
    ("HR - Croatia", "HR"),
    ("IE - Ireland", "IE"),
    ("EN - England", "EN"),
    ("WA - Wales", "WA"),
    ("SC - Scotland", "SC"),
    ("US - USA", "US"),
]

def default_output_filename(country: str, year: int) -> str:
    code = (country or "xx").strip().lower()
    return f"litcal_{code}_{year}.js"

class MainWindow(QMainWindow):
    def __init__(self) -> None:
        super().__init__()
        self.setWindowTitle("Romcal → JS Exporter")
        self.resize(900, 700)

        central = QWidget()
        self.setCentralWidget(central)
        outer = QVBoxLayout(central)

        form_box = QGroupBox("Export")
        outer.addWidget(form_box)
        form = QGridLayout(form_box)

        self.country_combo = QComboBox()
        for label, code in COUNTRY_OPTIONS:
            self.country_combo.addItem(label, code)
        self.country_combo.setCurrentIndex(0)
        self.locale_edit = QLineEdit("de")
        self.package_edit = QLineEdit(COUNTRY_TO_PACKAGE["DE"])
        self.export_edit = QLineEdit("")
        self.year_spin = QSpinBox()
        self.year_spin.setRange(1900, 3000)
        self.year_spin.setValue(2026)
        self.only_primary = QCheckBox("Nur Haupteintrag pro Tag")
        self.only_primary.setChecked(False)
        self.include_optional = QCheckBox("Optionale Gedenktage einbeziehen")
        self.include_optional.setChecked(True)
        self.var_name_edit = QLineEdit("")

        self.output_edit = QLineEdit(str(Path.cwd() / default_output_filename(self.current_country_code(), 2026)))
        browse_btn = QPushButton("…")
        browse_btn.clicked.connect(self.browse_output)

        suggest_btn = QPushButton("Paket aus Land vorschlagen")
        suggest_btn.clicked.connect(self.suggest_package)

        install_btn = QPushButton("Install-Befehle anzeigen")
        install_btn.clicked.connect(self.show_install_commands)

        export_btn = QPushButton("Exportieren")
        export_btn.clicked.connect(self.export_calendar)

        row = 0
        form.addWidget(QLabel("Land"), row, 0)
        form.addWidget(self.country_combo, row, 1)
        form.addWidget(QLabel("Locale"), row, 2)
        form.addWidget(self.locale_edit, row, 3)
        row += 1

        form.addWidget(QLabel("romcal-Paket"), row, 0)
        form.addWidget(self.package_edit, row, 1, 1, 3)
        form.addWidget(suggest_btn, row, 4)
        row += 1

        form.addWidget(QLabel("Export-Name (optional)"), row, 0)
        form.addWidget(self.export_edit, row, 1, 1, 2)
        form.addWidget(QLabel("Jahr"), row, 3)
        form.addWidget(self.year_spin, row, 4)
        row += 1

        form.addWidget(QLabel("JS-Variablenname (optional)"), row, 0)
        form.addWidget(self.var_name_edit, row, 1, 1, 4)
        row += 1

        form.addWidget(QLabel("Ausgabedatei"), row, 0)
        form.addWidget(self.output_edit, row, 1, 1, 3)
        form.addWidget(browse_btn, row, 4)
        row += 1

        form.addWidget(self.only_primary, row, 0, 1, 2)
        form.addWidget(self.include_optional, row, 2, 1, 3)
        row += 1

        buttons = QHBoxLayout()
        buttons.addWidget(install_btn)
        buttons.addStretch(1)
        buttons.addWidget(export_btn)
        outer.addLayout(buttons)

        self.log = QPlainTextEdit()
        self.log.setReadOnly(True)
        outer.addWidget(self.log, 1)

        help_box = QGroupBox("Hinweise")
        outer.addWidget(help_box)
        help_layout = QVBoxLayout(help_box)
        help_text = QLabel(
            "Diese App ruft ein Node-Skript auf, das romcal und ein Kalenderpaket lädt. "
            "romcal v3 ist noch im dev/beta-Stand, daher kann es bei einzelnen Paketen "
            "nötig sein, einen bestimmten Export-Namen einzutragen."
        )
        help_text.setWordWrap(True)
        help_layout.addWidget(help_text)

        self.country_combo.currentIndexChanged.connect(self.on_country_changed)
        self.year_spin.valueChanged.connect(self.update_output_name)
        self.update_output_name()

    def append_log(self, text: str) -> None:
        self.log.appendPlainText(text)

    def current_country_code(self) -> str:
        return (self.country_combo.currentData() or "DE").strip().upper()

    def on_country_changed(self) -> None:
        self.suggest_package()
        self.update_output_name()

    def update_output_name(self) -> None:
        current = Path(self.output_edit.text().strip() or ".")
        directory = current.parent if current.suffix else Path.cwd()
        filename = default_output_filename(self.current_country_code(), self.year_spin.value())
        self.output_edit.setText("/home/florian/.local/share/plasma/plasmoids/org.example.liturgicalcalendar/contents/data/generated_calendar.js")

    def suggest_package(self) -> None:
        code = self.current_country_code()
        pkg = COUNTRY_TO_PACKAGE.get(code)
        if pkg:
            self.package_edit.setText(pkg)
            self.append_log(f"Paket für {code}: {pkg}")
        else:
            QMessageBox.information(
                self,
                "Kein Vorschlag",
                f"Für {code} ist kein Paket-Mapping hinterlegt. Trage das romcal-Paket direkt ein.",
            )

    def browse_output(self) -> None:
        target, _ = QFileDialog.getSaveFileName(
            self,
            "JS-Datei speichern",
            self.output_edit.text(),
            "JavaScript (*.js);;Alle Dateien (*)",
        )
        if target:
            self.output_edit.setText(target)

    def default_export_for_country(self) -> str:
        code = self.current_country_code()
        country_names = {
            "DE": "Germany",
            "AT": "Austria",
            "CH": "Switzerland",
            "FR": "France",
            "IT": "Italy",
            "NL": "Netherlands",
            "BE": "Belgium",
            "LU": "Luxembourg",
            "ES": "Spain",
            "PT": "Portugal",
            "PL": "Poland",
            "CZ": "CzechRepublic",
            "SK": "Slovakia",
            "HU": "Hungary",
            "SI": "Slovenia",
            "HR": "Croatia",
            "IE": "Ireland",
            "EN": "England",
            "WA": "Wales",
            "SC": "Scotland",
            "US": "USA",
        }
        locale = (self.locale_edit.text().strip() or "de").replace("-", "_")
        locale_part = locale[:1].upper() + locale[1:]
        return f"{country_names.get(code, code)}_{locale_part}"

    def show_install_commands(self) -> None:
        pkg = self.package_edit.text().strip()
        msg = (
            "Führe im Projektordner aus:\n\n"
            f"npm install romcal@dev {pkg}@dev\n\n"
            "Python-Abhängigkeit:\n"
            "pip install PyQt6\n"
        )
        QMessageBox.information(self, "Install-Befehle", msg)

    def export_calendar(self) -> None:
        script_path = Path(__file__).with_name("romcal_export.mjs")
        if not script_path.exists():
            QMessageBox.critical(self, "Fehler", f"Node-Skript nicht gefunden:\n{script_path}")
            return

        output = Path(self.output_edit.text().strip())
        if not output.parent.exists():
            output.parent.mkdir(parents=True, exist_ok=True)

        args = [
            "node",
            str(script_path),
            "--year",
            str(self.year_spin.value()),
            "--locale",
            self.locale_edit.text().strip() or "de",
            "--package",
            self.package_edit.text().strip(),
            "--output",
            str(output),
            "--export",
            self.default_export_for_country(),
        ]

        export_name = self.export_edit.text().strip()
        if export_name:
            args += ["--export-name", export_name]

        var_name = self.var_name_edit.text().strip()
        if var_name:
            args += ["--var-name", "DATA"]

        if self.only_primary.isChecked():
            args.append("--only-primary")
        if not self.include_optional.isChecked():
            args.append("--exclude-optional")

        self.append_log("$ " + " ".join(shlex.quote(a) for a in args))

        try:
            proc = subprocess.run(
                args,
                text=True,
                capture_output=True,
                check=False,
            )
        except FileNotFoundError:
            QMessageBox.critical(
                self,
                "Node fehlt",
                "Der Befehl 'node' wurde nicht gefunden. Installiere Node.js und die romcal-Pakete zuerst.",
            )
            return

        if proc.stdout.strip():
            self.append_log(proc.stdout.strip())
        if proc.stderr.strip():
            self.append_log(proc.stderr.strip())

        if proc.returncode != 0:
            QMessageBox.critical(
                self,
                "Export fehlgeschlagen",
                "Der Export ist fehlgeschlagen. Details stehen im Log.",
            )
            return

        try:
            result = json.loads(proc.stdout)
            count = result.get("count", "?")
            export_used = result.get("exportNameUsed", "")
            QMessageBox.information(
                self,
                "Fertig",
                f"Export erfolgreich.\n\nDatei: {output}\nEinträge: {count}\nVerwendeter Export: {export_used}",
            )
        except Exception:
            QMessageBox.information(self, "Fertig", f"Export erfolgreich:\n{output}")

def main() -> int:
    app = QApplication(sys.argv)
    app.setApplicationName("Romcal JS Exporter")
    window = MainWindow()
    window.show()
    return app.exec()

if __name__ == "__main__":
    raise SystemExit(main())
