import { base44 } from "@/api/base44Client";

// Die komplette Führung durch die Plattform. Jedes Kapitel steht für einen
// Bereich, jeder Schritt erklärt genau, was hier geht und wie man hinkommt.
// "to" schickt dich direkt auf die Seite — du siehst es also, statt es zu lesen.

export const CHAPTERS = [
  {
    id: "start",
    title: "Ankommen",
    subtitle: "Was das hier ist — und was nicht",
    icon: "🖤",
    always: true,
    interests: [],
    steps: [
      {
        title: "Das ist kein Katalog zum Durchklicken",
        text: "Hier stehen keine Videos, die einfach ablaufen. Es sind Figuren, die mit dir reden, auf dich reagieren und sich an dich erinnern. Du redest mit ihnen — sie antworten dir.",
        tips: ["Jede Figur hat eine eigene Persönlichkeit", "Alles passiert in Echtzeit, nichts ist vorproduziert", "Du kannst jederzeit aufhören und später weitermachen"],
      },
      {
        title: "Alle Figuren sind KI — immer",
        text: "Kein Mensch sitzt am anderen Ende, solange es nicht ausdrücklich als echte Person gekennzeichnet ist. Antworten kommen von einer KI und sind entsprechend markiert. Wer als 'Real' gekennzeichnet ist, wird zusätzlich von der Person selbst betreut.",
        tips: ["KI-Nachrichten sind gekennzeichnet", "Bei 'Real'-Figuren kann die echte Person mitschreiben", "Treffen gegen Bezahlung gibt es hier nicht"],
      },
      {
        title: "Nur für Erwachsene",
        text: "Vor dem ersten Blick kommt die Altersabfrage, danach die Einwilligung. Ohne beides geht nichts. Die App merkt sich deine Antwort im Browser.",
        tips: ["Altersabfrage beim ersten Besuch", "Danach die Einwilligung zur Nutzung", "Beides ist Pflicht, nicht optional"],
      },
      {
        title: "Alles ist jederzeit umkehrbar",
        text: "Du kannst ein Szenario wechseln, einen Chat zurücksetzen, deine Fotos löschen, aufhören und wieder anfangen. Es gibt hier keinen Punkt ohne Zurück.",
        tips: ["Chat zurücksetzen jederzeit möglich", "Referenzfotos kannst du wieder entfernen", "Nichts wird dir aufgezwungen"],
      },
    ],
  },
  {
    id: "figuren",
    title: "Figuren",
    subtitle: "Wer hier auf dich wartet",
    icon: "🎭",
    interests: ["Reden & Flirten", "Nur stöbern", "Rollenspiel"],
    steps: [
      {
        title: "Die drei Hauptfiguren",
        text: "Artanis ist die männliche Figur, Tania die weibliche, dazu gibt es das Paar, das zusammen auftritt. Jede hat eine eigene Art zu reden, eigene Themen und eigene Grenzen.",
        to: "/artanis",
        tips: ["Artanis — ruhig, direkt, fordert dich heraus", "Tania — warm, neugierig, fragt viel nach", "Das Paar — beide gleichzeitig im Gespräch"],
      },
      {
        title: "Das Profil einer Figur",
        text: "Auf der Profilseite siehst du Bild, Beschreibung, Themen und Status. Von dort startest du den Chat oder rufst sie direkt an.",
        tips: ["Status zeigt, ob sie da ist", "Themen verraten, worüber sie reden will", "Von hier geht es in Chat und Videochat"],
      },
      {
        title: "Es gibt mehr als die drei",
        text: "Neben den Hauptfiguren gibt es weitere Charaktere, auch selbst angelegte. Im Chat kannst du mitten im Gespräch jemanden dazuholen — die neue Person spielt dann mit.",
        to: "/explore",
        tips: ["Im Chat oben rechts auf das Plus", "Mehrere Figuren gleichzeitig möglich", "Jede spricht mit eigenem Namen"],
      },
      {
        title: "Eine Figur selbst mitbringen",
        text: "An der Dockingstation beschreibst du einfach, wie jemand sein soll — Aussehen, Charakter, Ton. Daraus wird eine neue Figur mit unserer Persönlichkeit im Hintergrund.",
        to: "/dock",
        tips: ["Freie Beschreibung statt Formular", "Ergebnis läuft mit derselben Technik wie die Hauptfiguren", "Kannst du später wieder löschen"],
      },
      {
        title: "Zuschauen statt mitmachen",
        text: "Manchmal will man nur sehen, was passiert. Im Chat gibt es dafür den Spanner-Schalter: Du bist dann nicht Teil der Handlung, sondern der, der zusieht und dirigiert.",
        to: "/messages",
        tips: ["Schalter 'Spanner' oben im Chat", "Die Figuren spielen miteinander, für dich", "Du sagst, was als Nächstes kommt"],
      },
    ],
  },
  {
    id: "chat",
    title: "Chatten",
    subtitle: "Schreiben, sprechen, schicken",
    icon: "💬",
    interests: ["Reden & Flirten", "Bilder & Videos", "Rollenspiel"],
    steps: [
      {
        title: "So ist der Chat aufgebaut",
        text: "Links die Liste der Gespräche, rechts das Gespräch. Den Balken dazwischen ziehst du dir breiter oder schmaler, so wie es dir passt. Ganz breit ist bei Bildern angenehmer.",
        to: "/messages",
        tips: ["Balken ziehen = Breite der Liste", "Die Breite bleibt gemerkt", "Jedes Gespräch hat einen eigenen Reiter"],
      },
      {
        title: "Mehrere Gespräche gleichzeitig",
        text: "Jedes Gespräch öffnet einen Reiter oben. Du kannst zwischen ihnen springen und sie einzeln schließen — nichts geht verloren, auch wenn du die Seite neu lädst.",
        tips: ["Reiter oben anklicken zum Wechseln", "Nach dem Neuladen bist du wieder im letzten Gespräch", "Entwürfe bleiben pro Gespräch erhalten"],
      },
      {
        title: "Schreiben, sprechen, diktieren",
        text: "Du kannst tippen oder das Mikrofon benutzen. Gesprochenes wird in Text umgewandelt und landet direkt im Eingabefeld — praktisch, wenn du keine Hand frei hast.",
        tips: ["Mikrofon-Knopf startet die Aufnahme", "Nochmal tippen beendet sie", "Der Text erscheint zum Nachbessern"],
      },
      {
        title: "Dateien einfach reinziehen",
        text: "Bilder, Videos und Ton kannst du per Drag & Drop ins Fenster ziehen oder über den Anhang-Knopf auswählen. Alles landet zuerst in einer Warteschlange — gesendet wird erst, wenn du es willst.",
        tips: ["Mehrere Dateien auf einmal möglich", "Einzelne vor dem Senden wieder entfernen", "Mit dem Text zusammen abschicken"],
      },
      {
        title: "Was die KI dir zurückgibt",
        text: "Antworten kommen als Text, oft mit Bildern, manchmal als Sprachnachricht oder kurzem Video. Unter der Nachricht stehen Vorschläge, die du einfach anklicken kannst.",
        tips: ["Vorschläge anklicken = sofort antworten", "Bilder kannst du antippen und groß ansehen", "Alles lässt sich herunterladen"],
      },
      {
        title: "Zurücksetzen und neu anfangen",
        text: "Wenn ein Gespräch eine falsche Richtung genommen hat, setzt du es zurück. Danach startest du neu — inklusive Szenario und Referenzfotos.",
        tips: ["Zurücksetzen-Knopf oben im Chat", "Löscht den Verlauf dieses Gesprächs", "Andere Gespräche bleiben unberührt"],
      },
    ],
  },
  {
    id: "szenarien",
    title: "Szenarien",
    subtitle: "Wo und wie es passiert",
    icon: "📍",
    interests: ["Rollenspiel", "Storys zum Mitmachen", "Reden & Flirten"],
    steps: [
      {
        title: "Ein Szenario wählen",
        text: "Bevor der Chat richtig losgeht, suchst du aus, wo ihr euch befindet — ein Ort, eine Situation, eine Stimmung. Das legt den ganzen Rahmen fest.",
        to: "/messages",
        tips: ["Auswahl erscheint beim ersten Öffnen", "Jedes Szenario hat eigene Fragen", "Wechseln kannst du jederzeit"],
      },
      {
        title: "Die Fragen zu Beginn",
        text: "Jedes Szenario stellt ein paar Fragen: wer du bist, wie jemand aussieht, was ihr anhabt, wo genau ihr steht. Was du antwortest, bleibt die ganze Zeit gültig.",
        tips: ["Eigene Antworten sind erlaubt", "Fragen lassen sich überspringen", "Alles überspringen geht auch"],
      },
      {
        title: "Selbst etwas hinzufügen",
        text: "Bei den Mehrfach-Auswahlen kannst du eigene Begriffe ergänzen — tippen oder sprechen. Damit machst du das Szenario genau zu deinem.",
        to: "/messages",
        tips: ["Eigenes Feld unter den Vorschlägen", "So viele wie du willst auswählen", "Auch per Stimme eingebbar"],
      },
      {
        title: "Der Ort bleibt bestehen",
        text: "Die Figuren bleiben dort, wo ihr seid. Wenn du den Ort wechselst, wird der Wechsel erzählt — nicht einfach übersprungen. Gegenstände, die es dort nicht gibt, kommen auch nicht vor.",
        tips: ["Kein Springen zwischen Orten", "Du gibst den Wechsel vor", "Die Geschichte läuft weiter"],
      },
      {
        title: "Das Szenario wechseln",
        text: "Oben im Chat siehst du das laufende Szenario und kannst es jederzeit austauschen. Deine bisherigen Antworten werden übernommen, wo sie passen.",
        tips: ["Szenario-Knopf oben im Chat", "Neue Fragen nur bei Bedarf", "Verlauf bleibt erhalten"],
      },
    ],
  },
  {
    id: "bilder",
    title: "Bilder & Videos",
    subtitle: "Wie die Bilder entstehen",
    icon: "📸",
    interests: ["Bilder & Videos", "Zuschauen", "Storys zum Mitmachen"],
    steps: [
      {
        title: "Bilder entstehen aus dem Gespräch",
        text: "Die Figur schickt Bilder, die zur Situation passen. Du musst nichts dafür tun — sie beschließt selbst, wann ein Bild passt. Nachfragen hilft.",
        to: "/messages",
        tips: ["Bilder kommen als Nachricht", "Antippen zum Großansehen", "Herunterladen per Knopf"],
      },
      {
        title: "Sofort noch ein Bild",
        text: "Wenn dir eines gefällt, gibt es dafür einen Knopf: 'Noch ein Bild'. Es wird im gleichen Look erzeugt, ohne dass die Figur erst antworten muss.",
        to: "/messages",
        tips: ["Knopf oben im Chat und unter der Nachricht", "Gleiche Umgebung, gleiche Kleidung", "Andere Position, anderer Blickwinkel"],
      },
      {
        title: "Deine eigenen Fotos als Vorlage",
        text: "Du kannst eigene Bilder hochladen. Die KI nutzt sie als Vorlage, damit die Personen auf allen Bildern gleich aussehen. Einmal hochgeladen, gelten sie dauerhaft.",
        to: "/messages",
        tips: ["Über den Knopf mit dem Personensymbol", "Mehrere Bilder möglich", "Jederzeit wieder entfernbar"],
      },
      {
        title: "Ein Gesicht bleibt ein Gesicht",
        text: "Die Figur sieht auf jedem Bild gleich aus — gleiche Haare, gleiche Farbe, gleicher Körper. Ein Bild, das dir besonders gefällt, kannst du als neue Vorlage merken.",
        tips: ["'Als Referenz merken' unter dem Bild", "Gilt für alle künftigen Bilder", "Verhindert, dass jemand anders aussieht"],
      },
      {
        title: "Bilder, die etwas kosten",
        text: "Manche Bilder und Videos sind verschlossen und mit einem Preis versehen. Freischalten kannst du sie mit Coins aus der Börse oder direkt per Zahlung.",
        to: "/coins",
        tips: ["Verschlossene Bilder sind unkenntlich", "Freischalten mit Coins oder Karte", "Was du freigeschaltet hast, bleibt frei"],
      },
      {
        title: "Wenn ein Bild nicht geht",
        text: "Manches lässt sich als Bild nicht darstellen. Dann sagt die Figur es offen und bietet an, das für dich nachzudrehen — als eigenen Satz Bilder oder Clip.",
        tips: ["Hinweis erscheint direkt im Chat", "'Nachdrehen lassen' führt zur Anfrage", "Du beschreibst, was du willst"],
      },
    ],
  },
  {
    id: "sprechstunde",
    title: "Sprechstunde",
    subtitle: "Der geschützte Rahmen",
    icon: "🛋️",
    interests: ["Sprechstunde", "Reden & Flirten"],
    steps: [
      {
        title: "Worum es geht",
        text: "Die Sprechstunde ist ein ruhiger Ort für Gespräche, die sonst keinen Platz haben — Fragen, Unsicherheiten, Dinge, die man selten laut sagt. Kein Urteil, kein Mitleid.",
        to: "/therapy",
        tips: ["Eigener Bereich, getrennt vom Chat", "Du bestimmst das Thema", "Jederzeit beendbar"],
      },
      {
        title: "Rollen und Tiefe",
        text: "Du entscheidest, wer führt: die Figur als Gegenüber oder du. Und wie tief es gehen soll — sanft, tief oder schonungslos.",
        tips: ["Drei Stufen der Intensität", "Rolle frei wählbar", "Modus: geführt, offen oder Rollenspiel"],
      },
      {
        title: "Öffentlich oder privat",
        text: "Eine Sitzung kann privat bleiben oder öffentlich einsehbar sein. Öffentliche Sitzungen kann jeder lesen — privates sieht nur du.",
        tips: ["Voreinstellung: privat", "Öffentlich nur, wenn du es willst", "Lässt sich jederzeit ändern"],
      },
      {
        title: "Anonym teilnehmen",
        text: "Wenn du nicht erkennbar sein willst, kannst du anonym teilnehmen. Dein Name taucht dann nirgends auf.",
        tips: ["Schalter beim Anlegen", "Name wird ausgeblendet", "Gilt nur für diese Sitzung"],
      },
    ],
  },
  {
    id: "live",
    title: "Live & Videochat",
    subtitle: "Sehen und gesehen werden",
    icon: "🎥",
    interests: ["Live dabei sein", "Zuschauen"],
    steps: [
      {
        title: "Live-Räume",
        text: "Im Live-Bereich laufen Übertragungen. Manche sind offen für alle, andere nur zum Zuschauen oder privat. Der Status zeigt dir, was gerade läuft.",
        to: "/live",
        tips: ["Offen, Zuschauen oder Privat", "Laufende und geplante Räume", "Beitreten per Klick"],
      },
      {
        title: "Videochat mit einer Figur",
        text: "Aus jedem Chat heraus kannst du in einen Videochat wechseln. Die Figur ist dann sichtbar und reagiert auf das, was du sagst.",
        to: "/messages",
        tips: ["Kamerasymbol oben im Chat", "Läuft im Browser", "Zurück in den Text jederzeit"],
      },
      {
        title: "Einen echten Anruf starten",
        text: "Für Gespräche mit echten Personen gibt es eigene Anrufe. Du erzeugst einen Link oder Code und gibst ihn weiter — wer ihn hat, kommt rein.",
        to: "/call",
        tips: ["Link, Code oder QR zum Weitergeben", "Gilt nur für diese Runde", "Läuft im Browser, ohne Anmeldung für Gäste"],
      },
      {
        title: "Einladungen mit Begrüßung",
        text: "Wenn du jemanden in einen Chat holst, kann eine fertige Begrüßung mitgehen. Der Gast weiß dann sofort, worum es geht.",
        to: "/messages",
        tips: ["Text wird vorausgefüllt", "Funktioniert auch über WhatsApp", "Du bestimmst die Formulierung"],
      },
    ],
  },
  {
    id: "erschaffen",
    title: "Selbst erschaffen",
    subtitle: "Deine eigene Werkbank",
    icon: "🛠️",
    interests: ["Selbst erschaffen", "Bilder & Videos"],
    steps: [
      {
        title: "Das Studio",
        text: "Das Studio ist deine Werkbank. Hier legst du alles an, was es auf der Plattform gibt — Figuren, Stimmen, Inhalte, Storys, Themen, Übertragungen und Wettbewerbe.",
        to: "/studio",
        tips: ["Alles an einem Ort", "Jeder Bereich ein eigener Reiter", "Angelegtes ist sofort live"],
      },
      {
        title: "Figuren anlegen",
        text: "Eine Figur besteht aus Name, Beschreibung, Bild und einer Anweisung, wie sie sich verhalten soll. Genau diese Anweisung macht ihren Charakter aus.",
        to: "/studio",
        tips: ["Bild hochladen oder erzeugen lassen", "Eigene Verhaltensanweisung möglich", "Figuren lassen sich deaktivieren"],
      },
      {
        title: "Stimmen",
        text: "In der Stimmbank legst du Stimmen an — aus einer Grundstimme, mit Stimmung, Tempo und Tiefe. Du kannst auch eigene Aufnahmen hochladen.",
        to: "/studio",
        tips: ["Fünf Grundstimmen zur Auswahl", "Eigene Audiodatei hochladbar", "Stimmung und Tempo einstellbar"],
      },
      {
        title: "Inhalte, Storys und Themen",
        text: "Inhalte sind das, was verkauft oder freigeschaltet wird. Storys sind Geschichten, die die Figur im Chat als eigene Erlebnisse erzählt. Themen ordnen alles ein.",
        to: "/studio",
        tips: ["Preis frei oder festlegbar", "Storys fließen in die Gespräche ein", "Themen als Schlagworte"],
      },
      {
        title: "Sichern und weitergeben",
        text: "Figuren kannst du als Datei exportieren und woanders wieder importieren. Damit geht nichts verloren und du kannst Einstellungen weiterreichen.",
        to: "/studio",
        tips: ["Export als Datei", "Import auf jedem Gerät", "Ideal als Sicherung"],
      },
      {
        title: "Modelle für Text und Bild",
        text: "Du kannst einstellen, welche KI für Antworten und welche für Bilder benutzt wird. Mehrere Modelle stehen bereit und lassen sich einzeln abschalten.",
        to: "/studio",
        tips: ["Text- und Bildmodelle getrennt", "Auswahl direkt im Chat sichtbar", "Abschalten statt löschen"],
      },
    ],
  },
  {
    id: "wettbewerbe",
    title: "Wettbewerbe & Community",
    subtitle: "Mitmachen und abstimmen",
    icon: "🏆",
    interests: ["Wettbewerbe", "Nur stöbern", "Selbst erschaffen"],
    steps: [
      {
        title: "Wie ein Wettbewerb läuft",
        text: "Ein Wettbewerb hat eine Kategorie, eine Laufzeit und einen Preis. Beiträge werden eingereicht, danach wird abgestimmt und der Gewinner bekanntgegeben.",
        to: "/contests",
        tips: ["Kategorie und Regeln stehen oben", "Beiträge offen oder erst geprüft", "Manche Wettbewerbe wiederholen sich"],
      },
      {
        title: "Einen Beitrag einreichen",
        text: "Du lädst ein Bild, ein Video oder einen Text hoch, gibst ihm einen Titel und reichst ihn ein. Anonym geht auch.",
        to: "/contests",
        tips: ["Bild, Video oder Text", "Anonym möglich", "Begrenzte Anzahl pro Person"],
      },
      {
        title: "Abstimmen",
        text: "Bei laufender Abstimmung kannst du für Beiträge stimmen. Wie viele Stimmen du hast, steht beim Wettbewerb dabei.",
        to: "/contests",
        tips: ["Stimmen pro Person begrenzt", "Manchmal entscheidet eine Jury", "Ergebnis steht nach Ablauf fest"],
      },
      {
        title: "Die Community",
        text: "Im Community-Bereich teilen Nutzer eigene Bilder und Videos und bewerten sich gegenseitig. Likes und Sterne, anonym oder mit Namen.",
        to: "/community",
        tips: ["Beiträge liken und bewerten", "Anonym veröffentlichen möglich", "Nach Themen sortiert"],
      },
    ],
  },
  {
    id: "geld",
    title: "Coins & Bezahlen",
    subtitle: "Wie das mit dem Geld läuft",
    icon: "🪙",
    interests: ["Bilder & Videos", "Selbst erschaffen"],
    steps: [
      {
        title: "Die Börse",
        text: "Coins sind die Währung hier. Du kaufst sie in der Börse und gibst sie für verschlossene Inhalte aus. Dein Stand steht immer oben.",
        to: "/coins",
        tips: ["Coins aufladen per Karte", "Verlauf aller Bewegungen", "Stand jederzeit sichtbar"],
      },
      {
        title: "Zahlungslink für Absprachen",
        text: "Wenn du dich mit jemandem auf einen Betrag geeinigt hast, erzeugst du einen Zahlungslink. Der landet als Nachricht im Chat und führt direkt zur Bezahlung.",
        to: "/paylinks",
        tips: ["Betrag und Zweck frei", "Als Nachricht verschickbar", "Status: offen oder bezahlt"],
      },
      {
        title: "Gratis-Zugang",
        text: "Bestimmte Zugänge bekommen alles ohne Bezahlung — der Besitzer kann das für einzelne Personen freischalten. Auch Einladungen können einen solchen Zugang mitbringen.",
        to: "/account",
        tips: ["Einladungscode kann Gratis-Zugang enthalten", "Im Chat oben wird der Status angezeigt", "Gilt dauerhaft"],
      },
      {
        title: "Was was kostet",
        text: "Reden ist frei. Bilder und Videos sind anfangs kostenlos und danach kostenpflichtig. Live und Videochat können eigene Preise haben.",
        tips: ["Erste Bilder gratis", "Danach pro Freischaltung", "Gratis-Zugang zahlt nie"],
      },
    ],
  },
  {
    id: "sicherheit",
    title: "Sicher & privat",
    subtitle: "Was bleibt bei dir",
    icon: "🔒",
    always: true,
    interests: [],
    steps: [
      {
        title: "Was privat bleibt",
        text: "Deine Chats, deine hochgeladenen Fotos und deine Einstellungen gehören dir. Private Sitzungen in der Sprechstunde sieht niemand sonst.",
        tips: ["Chats sind nur für dich", "Private Sitzungen bleiben privat", "Fotos jederzeit löschbar"],
      },
      {
        title: "Was öffentlich ist",
        text: "Was du in Wettbewerben, der Community oder als öffentliche Sitzung einreichst, können andere sehen. Anonyme Beiträge zeigen deinen Namen nicht.",
        tips: ["Eigene Entscheidung, nicht automatisch", "Anonym möglich", "Vorher überlegen, dann senden"],
      },
      {
        title: "Was es hier nicht gibt",
        text: "Keine Treffen gegen Bezahlung, keine Darstellung realer Personen ohne Einwilligung, keine Inhalte mit Minderjährigen, keine Gewalt oder Nötigung. Solche Anfragen werden abgelehnt.",
        tips: ["Kein Verkauf von Treffen", "Keine realen Personen ohne Zustimmung", "Meldungen werden geprüft"],
      },
      {
        title: "Erklärungen an und aus",
        text: "Überall wo ein kleines i steht, bekommst du eine Erklärung. Wenn du alles kennst, kannst du die Hinweise abschalten — und jederzeit wieder an.",
        tips: ["i-Knopf an den Bereichen", "Umschalter oben in der Kopfzeile", "Gilt nur für dich"],
      },
    ],
  },
  {
    id: "konto",
    title: "Dein Konto",
    subtitle: "Profil, Fotos, Zugang",
    icon: "👤",
    interests: ["Nur stöbern"],
    steps: [
      {
        title: "Dein Profil",
        text: "Im Konto siehst du deine Angaben und kannst sie ändern. Name, Bild und deine Interessen — all das fließt in die Gespräche mit ein.",
        to: "/account",
        tips: ["Name und Bild änderbar", "Interessen beeinflussen die Chats", "Alles freiwillig"],
      },
      {
        title: "Deine Vorlagen",
        text: "Bilder, die du als Vorlage hochlädst, liegen gesammelt an einem Ort. Von dort kannst du sie ansehen, ergänzen oder löschen.",
        to: "/messages",
        tips: ["Über den Knopf mit dem Personensymbol", "Gelten für alle Figuren", "Löschen wirkt sofort"],
      },
      {
        title: "Was du dir wünschst",
        text: "Es gibt einen Knopf, mit dem du einfach sagst, was du willst — getippt oder gesprochen. Daraus werden dir passende Angebote gemacht.",
        to: "/request",
        tips: ["Frei formulieren, kein Formular", "Auch per Stimme", "Du bekommst Vorschläge zurück"],
      },
      {
        title: "Reinkommen und einladen",
        text: "Zugang bekommt man über eine Einladung — als Link, kurzer Code oder QR-Bild. Der Besitzer legt fest, wer reinkommt und welche Rolle jemand hat.",
        to: "/account",
        tips: ["Code auf der Konto-Seite einlösbar", "Link, Code und QR führen zum selben Ziel", "Rollen: Nutzer oder Admin"],
      },
    ],
  },
  {
    id: "besitzer",
    title: "Für Besitzer",
    subtitle: "Die Konsole",
    icon: "⚙️",
    interests: ["Selbst erschaffen"],
    steps: [
      {
        title: "Die Lage auf einen Blick",
        text: "Die Besitzer-Konsole zeigt dir in einer Liste, was schon steht und was noch fehlt. Grün heißt fertig, gelb darf leer sein, rot fehlt wirklich.",
        to: "/owner",
        tips: ["Grün, gelb, rot statt Zahlen", "Jede Zeile erklärt sich selbst", "Von dort direkt zur Stelle springen"],
      },
      {
        title: "Menü und Schrift",
        text: "Die Knöpfe in der Kopfzeile sortierst du selbst, und du stellst Größe, Stärke und Abstand der Schrift ein. Alles mit Vorschau.",
        to: "/owner",
        tips: ["Einträge verschieben, umbenennen, löschen", "Schriftgröße und Stärke einstellen", "Auf Standard zurücksetzbar"],
      },
      {
        title: "Begrüßung und Erklärungen",
        text: "Hier drehst du die Begrüßung für neue Besucher an und aus, schreibst ihre Texte selbst und legst fest, welche Erklärungen es gibt.",
        to: "/owner",
        tips: ["Begrüßung komplett abschaltbar", "Texte frei überschreibbar", "Interessen-Auswahl anpassbar"],
      },
      {
        title: "Zugang vergeben",
        text: "Einladungen brauchen keine E-Mail-Adresse — du bekommst Link, Code und QR-Bild und gibst weiter, was gerade passt. Nur der letzte Weg braucht wirklich eine Adresse.",
        to: "/owner",
        tips: ["Link, Code, QR und E-Mail", "Gratis-Zugang mitliefern", "Wer drin ist, siehst du dort"],
      },
      {
        title: "Kanäle und Sicherung",
        text: "Im Kanal-Bereich sammelst du deine Kundenkontakte und springst mit einem Tipp in WhatsApp, Telegram oder Instagram. Unter Sichern lädst du deine Einstellungen als Datei.",
        to: "/owner",
        tips: ["Kontakte mit einem Tipp anschreiben", "Liste als Datei ausgeben", "Einstellungen sichern und zurückholen"],
      },
      {
        title: "Der Leitstand",
        text: "Im Leitstand siehst du laufende Chats und kannst eingreifen — selbst übernehmen oder die KI weiterreden lassen.",
        to: "/leitstand",
        tips: ["Wartende Chats oben", "Selbst übernehmen möglich", "Zurück an die KI jederzeit"],
      },
    ],
  },
];

export const TUTORIAL_INTERESTS = [
  "Reden & Flirten",
  "Storys zum Mitmachen",
  "Bilder & Videos",
  "Live dabei sein",
  "Selbst erschaffen",
  "Zuschauen",
  "Rollenspiel",
  "Sprechstunde",
  "Wettbewerbe",
  "Nur stöbern",
];

export const chapterById = (id) => CHAPTERS.find((c) => c.id === id) || null;
export const stepKey = (chapterId, step) => `${chapterId}:${step}`;

// Teilbarer Link auf genau eine Stelle — damit kannst du jemanden direkt
// dorthin schicken, wo es für ihn interessant wird.
export const tutorialLink = (chapterId, step = 0) => {
  const base = `${window.location.origin}/tutorial`;
  if (!chapterId) return base;
  return `${base}?chapter=${encodeURIComponent(chapterId)}&step=${step}`;
};

// ── Zustand: eine einzige Quelle für Spieler, Seite und Kopfzeile ──

let state = {
  loaded: false,
  open: false,
  picking: false,
  chapterIndex: 0,
  stepIndex: 0,
  interests: [],
  showAll: true,
  done: [],
  skipped: [],
  finished: false,
  recordId: null,
};

let listeners = [];
let saveTimer = null;

const emit = () => listeners.forEach((fn) => fn({ ...state }));

export const getTutorialState = () => ({ ...state });

export const subscribeTutorial = (fn) => {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((x) => x !== fn);
  };
};

export const visibleChapters = (s = state) => {
  if (s.showAll || !s.interests.length) return CHAPTERS;
  const list = CHAPTERS.filter(
    (c) => c.always || c.interests.some((i) => s.interests.includes(i))
  );
  return list.length ? list : CHAPTERS;
};

export const visibleStepCount = (s = state) =>
  visibleChapters(s).reduce((sum, c) => sum + c.steps.length, 0);

export const currentChapter = (s = state) => CHAPTERS[s.chapterIndex] || CHAPTERS[0];

// Der wievielte Schritt im gefilterten Durchlauf ist das gerade?
export const flatPosition = (s = state) => {
  const list = visibleChapters(s);
  let pos = 0;
  for (const c of list) {
    if (c.id === currentChapter(s).id) return pos + s.stepIndex + 1;
    pos += c.steps.length;
  }
  return pos;
};

const localKey = "artanis_tutorial_local";

const saveLocal = () => {
  try {
    localStorage.setItem(
      localKey,
      JSON.stringify({
        chapterIndex: state.chapterIndex,
        stepIndex: state.stepIndex,
        interests: state.interests,
        showAll: state.showAll,
        done: state.done,
        skipped: state.skipped,
        finished: state.finished,
      })
    );
  } catch (e) {
    /* ignore */
  }
};

const persist = () => {
  if (!state.loaded) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      const me = await base44.auth.me();
      if (!me?.id) return;
      const data = {
        userId: me.id,
        currentChapterId: currentChapter().id,
        currentStep: state.stepIndex,
        doneSteps: state.done,
        skippedChapters: state.skipped,
        interests: state.interests,
        showAll: state.showAll,
        paused: !state.open,
        finished: state.finished,
        lastSeenAt: new Date().toISOString(),
      };
      if (state.recordId) await base44.entities.TutorialProgress.update(state.recordId, data);
      else {
        const created = await base44.entities.TutorialProgress.create(data);
        state.recordId = created?.id || null;
      }
    } catch (e) {
      /* ohne Anmeldung bleibt der Stand im Browser */
    }
  }, 500);
};

export async function loadTutorial() {
  if (state.loaded) return state;
  let local = null;
  try {
    local = JSON.parse(localStorage.getItem(localKey) || "null");
  } catch (e) {
    local = null;
  }
  if (local) {
    state = {
      ...state,
      chapterIndex: local.chapterIndex || 0,
      stepIndex: local.stepIndex || 0,
      interests: local.interests || [],
      showAll: local.showAll !== false,
      done: local.done || [],
      skipped: local.skipped || [],
      finished: !!local.finished,
    };
  }
  try {
    const me = await base44.auth.me();
    if (me?.id) {
      const rows = await base44.entities.TutorialProgress.filter({ userId: me.id }, "-updated_date", 1);
      const row = rows[0];
      if (row) {
        const idx = CHAPTERS.findIndex((c) => c.id === row.currentChapterId);
        state = {
          ...state,
          recordId: row.id,
          chapterIndex: idx >= 0 ? idx : state.chapterIndex,
          stepIndex: row.currentStep || 0,
          interests: row.interests?.length ? row.interests : state.interests,
          showAll: row.showAll !== false,
          done: row.doneSteps || [],
          skipped: row.skippedChapters || [],
          finished: !!row.finished,
        };
      }
    }
  } catch (e) {
    /* Gast ohne Konto */
  }
  state.loaded = true;
  emit();
  return state;
}

const update = (patch, { persist: doPersist = true } = {}) => {
  state = { ...state, ...patch };
  saveLocal();
  if (doPersist) persist();
  emit();
};

export const openTutorial = ({ chapterId, step, pick } = {}) => {
  const idx = chapterId ? CHAPTERS.findIndex((c) => c.id === chapterId) : -1;
  update({
    open: true,
    picking: !!pick || (!state.interests.length && !state.done.length && idx < 0),
    chapterIndex: idx >= 0 ? idx : state.chapterIndex,
    stepIndex: typeof step === "number" ? step : idx >= 0 ? 0 : state.stepIndex,
  });
};

// Pause: schließt die Führung, merkt sich aber genau die Stelle.
export const pauseTutorial = () => update({ open: false, picking: false });
export const closeTutorial = () => update({ open: false, picking: false });

export const resumeTutorial = () => update({ open: true, picking: false, finished: false });

export const startPicking = () => update({ open: true, picking: true });

export const setInterests = (interests) => update({ interests, showAll: interests.length === 0 });

export const toggleInterest = (item) => {
  const next = state.interests.includes(item)
    ? state.interests.filter((i) => i !== item)
    : [...state.interests, item];
  setInterests(next);
};

export const setShowAll = (showAll) => update({ showAll });

export const goToChapter = (chapterId, step = 0) => {
  const idx = CHAPTERS.findIndex((c) => c.id === chapterId);
  if (idx < 0) return;
  update({ chapterIndex: idx, stepIndex: step, picking: false, finished: false });
};

const markDone = () => {
  const key = stepKey(currentChapter().id, state.stepIndex);
  if (!state.done.includes(key)) update({ done: [...state.done, key] }, { persist: false });
};

export const nextStep = () => {
  markDone();
  const chapter = currentChapter();
  if (state.stepIndex + 1 < chapter.steps.length) {
    update({ stepIndex: state.stepIndex + 1 });
    return;
  }
  const list = visibleChapters();
  const at = list.findIndex((c) => c.id === chapter.id);
  const following = list.slice(at + 1);
  if (following.length) {
    const idx = CHAPTERS.findIndex((c) => c.id === following[0].id);
    update({ chapterIndex: idx, stepIndex: 0 });
  } else {
    update({ finished: true, open: false });
  }
};

export const prevStep = () => {
  if (state.stepIndex > 0) {
    update({ stepIndex: state.stepIndex - 1 });
    return;
  }
  const list = visibleChapters();
  const at = list.findIndex((c) => c.id === currentChapter().id);
  const before = list.slice(0, at).pop();
  if (!before) return;
  const idx = CHAPTERS.findIndex((c) => c.id === before.id);
  update({ chapterIndex: idx, stepIndex: before.steps.length - 1 });
};

export const skipStep = () => {
  const key = stepKey(currentChapter().id, state.stepIndex);
  update({ done: state.done.filter((d) => d !== key) }, { persist: false });
  nextStep();
};

export const skipChapter = () => {
  const chapter = currentChapter();
  const list = visibleChapters();
  const at = list.findIndex((c) => c.id === chapter.id);
  const following = list.slice(at + 1);
  const skipped = state.skipped.includes(chapter.id) ? state.skipped : [...state.skipped, chapter.id];
  if (following.length) {
    const idx = CHAPTERS.findIndex((c) => c.id === following[0].id);
    update({ chapterIndex: idx, stepIndex: 0, skipped });
  } else {
    update({ skipped, finished: true, open: false });
  }
};

export const skipAll = () => update({ finished: true, open: false, picking: false });

export const resetTutorial = () =>
  update({
    chapterIndex: 0,
    stepIndex: 0,
    done: [],
    skipped: [],
    finished: false,
    open: true,
    picking: true,
  });