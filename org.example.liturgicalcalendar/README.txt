Installation:

1. Ordner nach ~/.local/share/plasma/plasmoids/ kopieren:
   cp -r org.example.liturgicalcalendar ~/.local/share/plasma/plasmoids/

2. Plasmashell neu starten:
   kquitapp6 plasmashell
   kstart6 plasmashell

3. Plasmoid im Panel hinzufügen.

Debug:
- Testweise separat starten:
  plasmawindowed org.example.liturgicalcalendar

Hinweise:
- Das Plasmoid arbeitet offline.
- Es enthält berechnete bewegliche Feiern und eine lokale JSON-Datei mit festen Feiern.
- Regionale/diözesane Sonderkalender sind noch nicht vollständig enthalten.
