import QtQuick
import "LiturgicalCalculator.js" as Calc
import "../data/generated_calendar.js" as FixedData

QtObject {
    id: root

    property var yearCache: ({})
    property var fixedCelebrations: []
    property bool dataLoaded: true
    property string lastError: ""
    property int revision: 0

    signal dataReady()

    Component.onCompleted: {
        console.log("FixedData:", FixedData)
        console.log("FixedData.DATA:", JSON.stringify(FixedData.DATA))
        fixedCelebrations = FixedData.DATA || []
        console.log("fixedCelebrations count:", fixedCelebrations.length)
        dataLoaded = true
        dataReady()
    }

    function invalidateCache() {
        yearCache = ({})
        revision++
        dataReady()
    }

    function loadFixedCelebrations() {
        const xhr = new XMLHttpRequest()
        const url = Qt.resolvedUrl("../data/fixed_celebrations_de.json")
        let finished = false

        function finalizeOk(list) {
            finished = true
            lastError = ""
            fixedCelebrations = Array.isArray(list) ? list : []
            invalidateCache()
        }

        function finalizeError(message) {
            finished = true
            lastError = message
            fixedCelebrations = []
            invalidateCache()
        }

        xhr.onreadystatechange = function() {
            if (xhr.readyState !== XMLHttpRequest.DONE)
                return

            if (xhr.status !== 0 && (xhr.status < 200 || xhr.status >= 300)) {
                finalizeError("HTTP-Fehler " + xhr.status + " bei " + url)
                return
            }

            try {
                const text = xhr.responseText || ""
                if (text.trim() === "") {
                    finalizeError("Leere JSON-Antwort bei " + url)
                    return
                }
                finalizeOk(JSON.parse(text))
            } catch (e) {
                finalizeError("JSON-Fehler: " + e + " bei " + url)
            }
        }

        xhr.onerror = function() {
            if (!finished)
                finalizeError("Ladefehler bei " + url)
        }

        xhr.onabort = function() {
            if (!finished)
                finalizeError("Laden abgebrochen bei " + url)
        }

        try {
            xhr.open("GET", url)
            xhr.send()
        } catch (e) {
            finalizeError("XHR-Fehler: " + e + " bei " + url)
        }
    }

    function ensureYear(year) {
        if (yearCache[year])
            return

        const newCache = Object.assign({}, yearCache)
        try {
            newCache[year] = Calc.buildOfflineCalendar(year, fixedCelebrations)
            yearCache = newCache
            revision++
        } catch (e) {
            lastError = "Kalenderberechnung fehlgeschlagen für " + year + ": " + e
            newCache[year] = ({})
            yearCache = newCache
            revision++
        }
    }

    function entriesFor(dateObj) {
        const year = dateObj.getFullYear()
        ensureYear(year)

        const map = yearCache[year] || {}
        const key = Calc.toIsoDate(dateObj)
        return map[key] || []
    }

    function liturgicalColorFor(dateObj) {
        const entries = entriesFor(dateObj)
        if (entries.length > 0 && entries[0].color)
            return entries[0].color
        return ""
    }
}
