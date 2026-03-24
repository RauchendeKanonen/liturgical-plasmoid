.pragma library

function toIsoDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function addDays(date, days) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() + days);
    return d;
}

function cloneDate(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function easterSunday(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
}

function christmasDate(year) {
    return new Date(year, 11, 25);
}

function firstAdventSunday(year) {
    const christmas = christmasDate(year);
    let d = cloneDate(christmas);
    while (d.getDay() !== 0) {
        d.setDate(d.getDate() - 1);
    }
    d.setDate(d.getDate() - 21);
    return d;
}

function baptismOfTheLord(year) {
    const epiphany = new Date(year, 0, 6);
    let nextSunday = cloneDate(epiphany);
    while (nextSunday.getDay() !== 0) {
        nextSunday.setDate(nextSunday.getDate() + 1);
    }
    return nextSunday;
}

function weekdayName(day) {
    return ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"][day];
}

function liturgicalSeason(dateObj) {
    const year = dateObj.getFullYear();
    const easter = easterSunday(year);
    const ashWednesday = addDays(easter, -46);
    const palmSunday = addDays(easter, -7);
    const pentecost = addDays(easter, 49);
    const advent = firstAdventSunday(year);
    const christmas = christmasDate(year);
    const baptism = baptismOfTheLord(year);

    if (dateObj >= advent && dateObj < christmas) return "Advent";
    if (dateObj >= christmas || dateObj <= baptism) return "Weihnachtszeit";
    if (dateObj >= ashWednesday && dateObj < palmSunday) return "Fastenzeit";
    if (dateObj >= palmSunday && dateObj < easter) return "Karwoche";
    if (dateObj >= easter && dateObj <= pentecost) return "Osterzeit";
    return "Jahreskreis";
}

function seasonColor(season, overrideColor) {
    if (overrideColor && overrideColor !== "") return overrideColor;
    switch (season) {
    case "Advent": return "violet";
    case "Fastenzeit": return "violet";
    case "Karwoche": return "red";
    case "Osterzeit": return "white";
    case "Weihnachtszeit": return "white";
    default: return "green";
    }
}

function addEntry(map, dateObj, item) {
    const key = toIsoDate(dateObj);
    if (!map[key]) map[key] = [];
    map[key].push(item);
}

function addCelebration(map, dateObj, title, rank, season, color, description) {
    addEntry(map, dateObj, {
        title: title,
        rank: rank,
        season: season,
        color: color,
        description: description,
        source: "offline"
    });
}

function sortDayEntries(entries) {
    const rankOrder = {
        "Hochfest": 1,
        "Hochrangiger Fast- und Abstinenztag": 2,
        "Gebotener geprägter Tag": 3,
        "Fest": 4,
        "Sonntag": 5,
        "Gedenktag": 6,
        "Wochentag": 7,
        "Stiller Tag": 8
    };
    entries.sort(function(a, b) {
        const ra = rankOrder[a.rank] || 99;
        const rb = rankOrder[b.rank] || 99;
        if (ra !== rb) return ra - rb;
        return String(a.title).localeCompare(String(b.title), "de");
    });
}

function postProcess(map) {
    for (const key in map) {
        if (!map.hasOwnProperty(key)) continue;
        sortDayEntries(map[key]);
    }
    return map;
}

function addWeekdayEntries(map, year) {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);

    for (let d = cloneDate(start); d <= end; d = addDays(d, 1)) {
        if (d.getDay() === 0) continue;

        const season = liturgicalSeason(d);
        const color = seasonColor(season, "");
        let desc = "Wochentag der liturgischen Zeit. Die Kirche begleitet im Jahreslauf das Heilshandeln Christi und deutet das Glaubensleben im Rhythmus des Kirchenjahres.";

        if (season === "Advent") {
            desc = "Wochentag im Advent. Die Kirche lebt in Erwartung der Ankunft des Herrn. Advent ist eine Zeit der Hoffnung, der inneren Sammlung und der Vorbereitung auf Weihnachten.";
        } else if (season === "Weihnachtszeit") {
            desc = "Wochentag der Weihnachtszeit. Im Mittelpunkt steht das Geheimnis der Menschwerdung Gottes. Christus ist als Licht für die Welt erschienen.";
        } else if (season === "Fastenzeit") {
            desc = "Wochentag der Fastenzeit. Die Liturgie ruft zu Umkehr, Buße, Gebet und Werken der Liebe auf. Diese Zeit bereitet auf das Ostergeheimnis vor.";
        } else if (season === "Karwoche") {
            desc = "Wochentag der Karwoche. Die Kirche betrachtet das Leiden Jesu Christi und geht mit ihm den Weg zum Kreuz und zur Auferstehung.";
        } else if (season === "Osterzeit") {
            desc = "Wochentag der Osterzeit. Die Kirche lebt aus der Freude über die Auferstehung Christi. Licht, Freude und Taufgedächtnis prägen diese Zeit.";
        } else if (season === "Jahreskreis") {
            desc = "Wochentag im Jahreskreis. In dieser Zeit betrachtet die Kirche besonders das öffentliche Wirken Jesu und das Wachstum des christlichen Lebens im Alltag.";
        }

        addCelebration(
            map,
            d,
            weekdayName(d.getDay()) + " der " + season,
            "Wochentag",
            season,
            color,
            desc
        );
    }
}

function addSundayEntries(map, year) {
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    const advent = firstAdventSunday(year);
    const christmas = christmasDate(year);

    let ordinaryCounter = 1;
    let easterCounter = 2;

    for (let d = cloneDate(start); d <= end; d = addDays(d, 1)) {
        if (d.getDay() !== 0) continue;

        const season = liturgicalSeason(d);

        if (toIsoDate(d) === toIsoDate(advent) ||
            toIsoDate(d) === toIsoDate(addDays(advent, 7)) ||
            toIsoDate(d) === toIsoDate(addDays(advent, 14)) ||
            toIsoDate(d) === toIsoDate(addDays(advent, 21))) {
            continue;
        }

        if (season === "Osterzeit") {
            if (easterCounter <= 7) {
                addCelebration(
                    map,
                    d,
                    easterCounter + ". Sonntag der Osterzeit",
                    "Sonntag",
                    season,
                    "white",
                    "Sonntag der Osterzeit. Die Kirche entfaltet in diesen Wochen die Freude über die Auferstehung Christi und lebt aus der Hoffnung des neuen Lebens."
                );
                easterCounter += 1;
            }
            continue;
        }

        if (season === "Advent") continue;
        if (season === "Weihnachtszeit") continue;
        if (season === "Karwoche") continue;

        if (season === "Jahreskreis") {
            addCelebration(
                map,
                d,
                ordinaryCounter + ". Sonntag im Jahreskreis",
                "Sonntag",
                season,
                "green",
                "Sonntag im Jahreskreis. Die Kirche betrachtet das Leben und Wirken Jesu Christi und das Wachstum des Glaubens im Alltag."
            );
            ordinaryCounter += 1;
        }
    }
}

function addPrincipalMovableCelebrations(map, year) {
    const easter = easterSunday(year);
    const ashWednesday = addDays(easter, -46);
    const palmSunday = addDays(easter, -7);
    const holyThursday = addDays(easter, -3);
    const goodFriday = addDays(easter, -2);
    const holySaturday = addDays(easter, -1);
    const ascension = addDays(easter, 39);
    const pentecost = addDays(easter, 49);
    const trinity = addDays(easter, 56);
    const corpusChristi = addDays(easter, 60);
    const christKing = addDays(firstAdventSunday(year), -7);
    const baptism = baptismOfTheLord(year);
    const advent = firstAdventSunday(year);

    addCelebration(map, ashWednesday, "Aschermittwoch", "Gebotener geprägter Tag", "Fastenzeit", "violet", "Mit dem Aschermittwoch beginnt die vierzigtägige Fastenzeit. Die Asche erinnert an Vergänglichkeit, Buße und den Ruf zur Umkehr des Herzens.");
    addCelebration(map, palmSunday, "Palmsonntag", "Sonntag", "Karwoche", "red", "Der Palmsonntag eröffnet die Heilige Woche. Er verbindet den feierlichen Einzug Jesu in Jerusalem mit der Verkündigung seines Leidens.");
    addCelebration(map, holyThursday, "Gründonnerstag", "Hochfest", "Triduum Sacrum", "white", "Am Abend des Gründonnerstags gedenkt die Kirche des Letzten Abendmahls, der Einsetzung der Eucharistie und des Priestertums sowie des Gebotes der Liebe.");
    addCelebration(map, goodFriday, "Karfreitag", "Hochrangiger Fast- und Abstinenztag", "Triduum Sacrum", "red", "Am Karfreitag betrachtet die Kirche das Leiden und Sterben Jesu am Kreuz. Es ist ein Tag des strengen Fastens, der Stille und der Kreuzverehrung.");
    addCelebration(map, holySaturday, "Karsamstag", "Stiller Tag", "Triduum Sacrum", "violet", "Der Karsamstag ist von stiller Erwartung geprägt. Die Kirche verharrt am Grab des Herrn und bereitet sich auf die Feier der Osternacht vor.");
    addCelebration(map, easter, "Ostersonntag", "Hochfest", "Osterzeit", "white", "Ostern ist das höchste Fest des Kirchenjahres. Die Auferstehung Jesu Christi ist die Mitte des christlichen Glaubens und der Sieg des Lebens über den Tod.");
    addCelebration(map, ascension, "Christi Himmelfahrt", "Hochfest", "Osterzeit", "white", "Vierzig Tage nach Ostern feiert die Kirche die Erhöhung Christi zur Rechten des Vaters. Das Fest richtet den Blick auf die Vollendung des Menschen in Gott.");
    addCelebration(map, pentecost, "Pfingstsonntag", "Hochfest", "Osterzeit", "red", "Pfingsten feiert die Sendung des Heiligen Geistes. Die Kirche erkennt darin ihren eigentlichen Geburtsmoment und die Kraft zum Zeugnis in der Welt.");
    addCelebration(map, trinity, "Dreifaltigkeitssonntag", "Hochfest", "Jahreskreis", "white", "Der Sonntag nach Pfingsten ist dem Geheimnis des einen Gottes in drei Personen gewidmet: Vater, Sohn und Heiliger Geist.");
    addCelebration(map, corpusChristi, "Fronleichnam", "Hochfest", "Jahreskreis", "white", "Fronleichnam ist das Hochfest des Leibes und Blutes Christi. Die Kirche bekennt öffentlich ihre Verehrung der Eucharistie als sakramentale Gegenwart des Herrn.");
    addCelebration(map, christKing, "Christkönigssonntag", "Hochfest", "Jahreskreis", "white", "Am letzten Sonntag des Kirchenjahres bekennt die Kirche Christus als König des Universums. Das Fest richtet den Blick auf die Vollendung der Geschichte in ihm.");
    addCelebration(map, baptism, "Taufe des Herrn", "Fest", "Weihnachtszeit", "white", "Mit der Taufe Jesu im Jordan endet die Weihnachtszeit. Zugleich beginnt das öffentliche Wirken Christi, der als geliebter Sohn des Vaters offenbart wird.");

    addCelebration(map, advent, "1. Adventssonntag", "Sonntag", "Advent", "violet", "Der erste Adventssonntag eröffnet das neue Kirchenjahr. Die Liturgie richtet den Blick auf das Kommen Christi in Herrlichkeit und auf seine Ankunft in der Geschichte.");
    addCelebration(map, addDays(advent, 7), "2. Adventssonntag", "Sonntag", "Advent", "violet", "Der zweite Adventssonntag vertieft die Erwartung des Herrn und ruft zu Wachsamkeit und Hoffnung auf.");
    addCelebration(map, addDays(advent, 14), "3. Adventssonntag (Gaudete)", "Sonntag", "Advent", "rose", "Der dritte Adventssonntag trägt den Namen Gaudete: Freut euch. Inmitten der Bußzeit leuchtet bereits die Freude über die Nähe des Herrn auf.");
    addCelebration(map, addDays(advent, 21), "4. Adventssonntag", "Sonntag", "Advent", "violet", "Der vierte Adventssonntag führt unmittelbar an das Weihnachtsgeheimnis heran und stellt häufig Maria und ihre gläubige Erwartung in den Mittelpunkt.");
}

function mergeFixedCelebrations(map, year, fixedList) {
    if (!Array.isArray(fixedList)) return;

    for (let i = 0; i < fixedList.length; ++i) {
        const item = fixedList[i];
        if (!item.date) continue;

        const parts = String(item.date).split("-");
        let month = 0;
        let day = 0;

        if (parts.length === 2) {
            month = Number(parts[0]);
            day = Number(parts[1]);
        } else if (parts.length === 3) {
            month = Number(parts[1]);
            day = Number(parts[2]);
        } else {
            continue;
        }

        if (!Number.isFinite(month) || !Number.isFinite(day)) continue;
        if (month < 1 || month > 12 || day < 1 || day > 31) continue;

        const d = new Date(year, month - 1, day);

        addCelebration(
            map,
            d,
            item.title || "",
            item.rank || "",
            item.season || liturgicalSeason(d),
            item.color || seasonColor(liturgicalSeason(d), ""),
            item.description || ""
        );
    }
}

function buildOfflineCalendar(year, fixedList) {
    const map = {};
    addWeekdayEntries(map, year);
    addSundayEntries(map, year);
    addPrincipalMovableCelebrations(map, year);
    mergeFixedCelebrations(map, year, fixedList);
    return postProcess(map);
}
