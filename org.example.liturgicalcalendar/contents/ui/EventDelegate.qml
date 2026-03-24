import QtQuick
import QtQuick.Controls as QQC2
import QtQuick.Layouts
import org.kde.kirigami as Kirigami

Rectangle {
    id: root
    radius: 8
    color: Kirigami.Theme.backgroundColor
    border.width: 1
    border.color: Qt.rgba(1, 1, 1, 0.08)

    property string title: ""
    property string rank: ""
    property string season: ""
    property string litColor: ""
    property string description: ""
    property bool showColor: true
    property bool showRank: true

    implicitHeight: layout.implicitHeight + 16

    ColumnLayout {
        id: layout
        anchors.fill: parent
        anchors.margins: 8
        spacing: 4

        RowLayout {
            Layout.fillWidth: true
            spacing: 8

            Rectangle {
                visible: showColor && litColor !== ""
                width: 12
                height: 12
                radius: 6
                Layout.alignment: Qt.AlignTop
                color: {
                    switch (litColor) {
                    case "white": return "#ddd8c8";
                    case "red": return "#b33939";
                    case "green": return "#3b7d3f";
                    case "violet": return "#6e4aa3";
                    case "purple": return "#6e4aa3";
                    case "rose": return "#d68cab";
                    case "black": return "#303030";
                    default: return "transparent";
                    }
                }
                border.width: litColor !== "" ? 1 : 0
                border.color: Qt.rgba(1, 1, 1, 0.15)
            }

            QQC2.Label {
                Layout.fillWidth: true
                text: title
                wrapMode: Text.WordWrap
                font.bold: true
            }
        }

        QQC2.Label {
            visible: showRank && rank !== ""
            Layout.fillWidth: true
            text: rank
            wrapMode: Text.WordWrap
            opacity: 0.8
        }

        QQC2.Label {
            visible: season !== ""
            Layout.fillWidth: true
            text: season
            wrapMode: Text.WordWrap
            opacity: 0.7
        }

        QQC2.Label {
            visible: description !== ""
            Layout.fillWidth: true
            text: description
            wrapMode: Text.WordWrap
            opacity: 0.95
        }
    }
}
