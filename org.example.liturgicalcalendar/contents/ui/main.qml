import QtQuick
import QtQuick.Controls as QQC2
import QtQuick.Layouts
import org.kde.plasma.plasmoid

PlasmoidItem {
    id: root

    Plasmoid.title: qsTr("Liturgischer Kalender")
    Plasmoid.icon: "view-calendar"
    preferredRepresentation: compactRepresentation

    property date selectedDate: new Date()
    property date visibleMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1)

    function sameDay(a, b) {
        return a.getFullYear() === b.getFullYear()
            && a.getMonth() === b.getMonth()
            && a.getDate() === b.getDate();
    }

    CalendarBackend {
        id: backend

        onDataReady: {
            backend.ensureYear(root.selectedDate.getFullYear())
            backend.ensureYear(root.visibleMonth.getFullYear())
            backend.ensureYear(root.visibleMonth.getFullYear() - 1)
            backend.ensureYear(root.visibleMonth.getFullYear() + 1)
        }
    }

    compactRepresentation: Item {
        implicitWidth: 50
        implicitHeight: 32

        QQC2.Label {
            anchors.centerIn: parent
            text: "Kal"
            font.bold: true
        }

        MouseArea {
            anchors.fill: parent
            onClicked: root.expanded = !root.expanded
        }
    }

    fullRepresentation: Item {
        Layout.minimumWidth: 360
        Layout.minimumHeight: 420
        Layout.preferredWidth: 420
        Layout.preferredHeight: 560

        Rectangle {
            anchors.fill: parent
            color: "transparent"

            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 10
                spacing: 8

                RowLayout {
                    Layout.fillWidth: true

                    QQC2.Button {
                        text: "<"
                        onClicked: {
                            root.visibleMonth = new Date(root.visibleMonth.getFullYear(), root.visibleMonth.getMonth() - 1, 1)
                            backend.ensureYear(root.visibleMonth.getFullYear())
                        }
                    }

                    QQC2.Label {
                        Layout.fillWidth: true
                        horizontalAlignment: Text.AlignHCenter
                        text: Qt.formatDate(root.visibleMonth, "MMMM yyyy")
                        font.bold: true
                    }

                    QQC2.Button {
                        text: ">"
                        onClicked: {
                            root.visibleMonth = new Date(root.visibleMonth.getFullYear(), root.visibleMonth.getMonth() + 1, 1)
                            backend.ensureYear(root.visibleMonth.getFullYear())
                        }
                    }
                }

                QQC2.DayOfWeekRow {
                    Layout.fillWidth: true
                    locale: Qt.locale()
                }

                QQC2.MonthGrid {
                    id: monthGrid
                    Layout.fillWidth: true
                    Layout.preferredHeight: 240

                    month: root.visibleMonth.getMonth()
                    year: root.visibleMonth.getFullYear()
                    locale: Qt.locale()

                    delegate: Rectangle {
                        required property var model

                        readonly property date cellDate: model.date
                        readonly property bool inCurrentMonth: model.month === monthGrid.month

                        implicitWidth: 40
                        implicitHeight: 36
                        radius: 4
                        color: root.sameDay(cellDate, root.selectedDate)
                               ? Qt.rgba(0.25, 0.45, 0.95, 0.25)
                               : "transparent"
                        border.width: root.sameDay(cellDate, new Date()) ? 1 : 0
                        border.color: Qt.rgba(0.25, 0.45, 0.95, 0.7)

                        Column {
                            anchors.centerIn: parent
                            spacing: 2

                            QQC2.Label {
                                anchors.horizontalCenter: parent.horizontalCenter
                                text: model.day
                                opacity: inCurrentMonth ? 1.0 : 0.35
                                font.bold: root.sameDay(cellDate, new Date())
                            }

                            Rectangle {
                                anchors.horizontalCenter: parent.horizontalCenter
                                width: 8
                                height: 8
                                radius: 4
                                visible: {
                                    const _rev = backend.revision
                                    return backend.entriesFor(cellDate).length > 0
                                }
                                color: {
                                    const _rev = backend.revision
                                    const c = backend.liturgicalColorFor(cellDate)
                                    switch (c) {
                                    case "white": return "#ddd8c8"
                                    case "red": return "#b33939"
                                    case "green": return "#3b7d3f"
                                    case "violet": return "#6e4aa3"
                                    case "purple": return "#6e4aa3"
                                    case "rose": return "#d68cab"
                                    case "black": return "#303030"
                                    default: return "#888888"
                                    }
                                }
                            }
                        }

                        MouseArea {
                            anchors.fill: parent
                            onClicked: {
                                root.selectedDate = cellDate
                                backend.ensureYear(cellDate.getFullYear())
                            }
                        }
                    }
                }

                QQC2.Label {
                    Layout.fillWidth: true
                    text: Qt.formatDate(root.selectedDate, "dddd, dd.MM.yyyy")
                    font.bold: true
                }

                QQC2.Label {
                    visible: backend.lastError !== ""
                    Layout.fillWidth: true
                    color: "tomato"
                    wrapMode: Text.Wrap
                    text: backend.lastError
                }

                ListView {
                    id: eventList
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    clip: true
                    spacing: 6

                    model: {
                        const _rev = backend.revision
                        return backend.entriesFor(root.selectedDate)
                    }

                    delegate: EventDelegate {
                        width: eventList.width
                        title: modelData.title || ""
                        rank: modelData.rank || ""
                        season: modelData.season || ""
                        litColor: modelData.color || ""
                        description: modelData.description || ""
                    }
                }
            }
        }
    }
}
