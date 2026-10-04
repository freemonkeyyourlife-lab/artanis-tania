import { Search, Tags, SquareUser, PenLine, Images, Layers, ArrowLeftRight, Coins } from "lucide-react";

// Der Lern-Ordner: jede Frage, die im Chat aufgekommen ist, mit ihrer Antwort —
// nach Themen sortiert, damit man sie wiederfindet. Nur für den Besitzer.

export const LERN_TOPICS = [
  {
    key: "finden",
    title: "Modelle finden und auswählen",
    icon: Search,
    intro: "Die Suche ist ein Lager, kein Laden. Du musst nicht suchen — du musst auswählen.",
    entries: [
      {
        frage: "Wie suche ich überhaupt nach Modellen?",
        antwort:
          "Gar nicht — jedenfalls nicht frei. Das Suchfeld holt direkt aus dem Katalog von Hugging Face. Das ist ein Lager: da liegt alles, was irgendjemand gebaut hat, sortiert nach Beliebtheit. Die Zahl daneben sind Downloads, kein Qualitätsurteil. Du brauchst die Handvoll aus dem Modell-Plan, nicht die Liste.",
        punkte: [
          "Suchbegriffe wie „flux“, „sdxl“ oder „realistic“ bringen Treffer — aber keine Ordnung.",
          "Die Wahrheit über ein Modell steht nicht im Namen, sondern in seinen zwei Etiketten.",
        ],
      },
      {
        frage: "Was ist ein „Space“?",
        antwort:
          "Keine Modell-Art. Ein Space ist eine kleine Demo-Seite, die jemand um ein Modell herum gebaut hat — ein Schaufenster, in dem man das Modell ausprobieren kann. Für dich nutzlos. Du brauchst nur das Modell selbst.",
      },
      {
        frage: "Welche nehme ich dann?",
        antwort:
          "Die aus dem Modell-Plan. Eine Handvoll deckt alles ab: zwei zum Entwerfen, zwei zum Veredeln, eins bis zwei zum Bearbeiten. Mehr brauchst du nicht.",
        punkte: [
          "Entwerfen (günstig, schnell, viele Varianten): Z-Image-Turbo, Qwen-Image-Lightning.",
          "Veredeln (echtes Licht, echte Haut): Seedream 4.5 / 5.0 Pro, FLUX.2 Pro.",
          "Bearbeiten (dieselbe Person, neue Pose): Nano Banana Pro, FLUX.1 Kontext Pro.",
        ],
      },
      {
        frage: "Wie lange hält so ein Modell?",
        antwort:
          "Ein paar Monate, dann kommt das nächste. Aber die Großen bleiben. Und immer das Neueste zu nehmen ist die Falle — du fängst jedes Mal wieder bei null an. Such dir zwei, drei aus und bleib dabei.",
      },
      {
        frage: "Haben die alle unterschiedliche Prompts?",
        antwort:
          "Nein. Dieselben Wörter, nur anders gewichtet. Was zählt, ist der Aufbau, nicht die Vokabeln: Motiv, Körper, Kleidung, Licht, Ort, Kamera.",
      },
    ],
  },
  {
    key: "namen",
    title: "Die Namen verstehen",
    icon: Tags,
    intro: "Der Name allein sagt fast nichts. Genau das ist der Grund, warum dir alles gleich vorkommt.",
    entries: [
      {
        frage: "Warum tauchen dieselben Namen immer wieder auf?",
        antwort:
          "Weil jede Liste sie unter einem anderen Blickwinkel zeigt. Das sind nicht sechs verschiedene Modelle — das ist dasselbe Modell, sechsmal mit einer anderen Frage davor. Nano Banana steht einmal bei „Was wir haben“, einmal bei „Dieselbe Person, neue Pose“ und einmal im Ablauf. Es ist immer dasselbe Programm; neu ist nur die Aufgabe.",
        punkte: [
          "„Was wir haben“ fragt: taugt es überhaupt?",
          "„Wofür bekannt“ fragt: wofür ist es berühmt?",
          "„Der Ablauf“ fragt: an welcher Stelle der Kette steht es?",
        ],
      },
      {
        frage: "Woran sehe ich dann den Unterschied?",
        antwort:
          "Nicht am Namen — an den zwei Spalten daneben: Familie und Freizügigkeit. Diese zwei Angaben entscheiden, ob ein Modell für dich taugt. Alles andere ist Beiwerk.",
        punkte: [
          "Familie: echt (Foto) · unecht-aber-hochwertig (3D-Render) · gezeichnet (2D) — gezeichnet ist ausgeschlossen.",
          "Freizügigkeit: ZAHM · ANZÜGLICH · SINNLICH · EXPLIZIT · HART.",
          "Ein Modell mit dem Etikett „gezeichnet“ fällt raus, egal wie gut es ist.",
        ],
      },
      {
        frage: "Was heißt die Zahl hinter dem Namen?",
        antwort:
          "Die Version. FLUX.1 zu FLUX.2 heißt: neuere Ausgabe. Höher ist meist besser, aber nicht immer — manche Versionen sind nur schneller, nicht schöner.",
      },
      {
        frage: "Und was heißt „Pro“, „Turbo“, „Lightning“, „dev“, „schnell“?",
        antwort:
          "Das sagt dir, wofür die Ausgabe gedacht ist — nicht, wie gut sie ist.",
        punkte: [
          "Pro = die beste, teurere Ausgabe. Zum Veredeln.",
          "Turbo und Lightning = dieselbe Qualität in wenigen Schritten, also viel billiger und schneller. Zum Aussuchen.",
          "dev = die offene Fassung, zum Selberlaufen.",
          "schnell = dasselbe, nur auf Deutsch.",
        ],
      },
    ],
  },
  {
    key: "person",
    title: "Dieselbe Person behalten",
    icon: SquareUser,
    intro: "Der Wiedererkennungswert kommt nicht vom Modell. Er kommt vom Bild.",
    entries: [
      {
        frage: "Wie bleibt dieselbe Frau dieselbe?",
        antwort:
          "Über ein Ankerbild. Ein gutes Foto wird zur Vorlage. Ab da wird nicht mehr frei generiert, sondern immer nur das Ankerbild bearbeitet — neue Pose, neuer Ort, neue Kleidung. Die Gleichheit kommt aus dem Bild, nicht aus dem Modell.",
        punkte: [
          "Das Ankerbild: Gesicht gut sichtbar, gleichmäßiges Licht, keine Sonnenbrille.",
          "Es wird an der Figur gespeichert und geht bei jeder Generierung mit.",
          "Ohne Ankerbild sieht sie in jedem Bild ein bisschen anders aus.",
        ],
      },
      {
        frage: "Muss ich dafür immer dasselbe Modell nehmen?",
        antwort:
          "Ja. Jedes Modell hat seine eigene Handschrift. Zwei Modelle, zwei Gesichter — auch beim selben Bild. Ein Modell pro Figur, und dabei bleiben.",
      },
      {
        frage: "Und wenn ich ein besseres Modell finde?",
        antwort:
          "Dann wechselst du einmal bewusst und baust dir ein neues Ankerbild. Aber nie mitten in einer Serie.",
      },
      {
        frage: "Was ist, wenn ein Körper etwas nicht kann?",
        antwort:
          "Dann kann es das nächste Modell auch nicht einfach so. Was ein Modell nicht hergibt, gibt es nicht her — dafür braucht es entweder ein anderes Modell oder ein antrainiertes Zusatzstück (LoRA) aus mehreren guten Bildern.",
      },
    ],
  },
  {
    key: "prompt",
    title: "Frisch schreiben oder erweitern",
    icon: PenLine,
    intro: "Der wichtigste Unterschied von allen — und der, an dem die meisten scheitern.",
    entries: [
      {
        frage: "Was ist der Unterschied zwischen einem Grundding und einer Erweiterung?",
        antwort:
          "Das sind zwei verschiedene Arten zu schreiben, nicht zwei verschiedene Modelle.",
        punkte: [
          "Frisch: alles beschreiben. Körper, Gesicht, Licht, Ort, Kamera.",
          "Erweitern: nur die Änderung — und dazu ausdrücklich, was sich nicht ändern darf.",
        ],
      },
      {
        frage: "Wechsle ich dafür das Modell?",
        antwort:
          "Nein — das ist der häufigste Fehler. Du wechselst die Art zu schreiben, nicht das Programm. Wer das Modell wechselt, bekommt eine andere Frau.",
      },
      {
        frage: "Wie schreibe ich eine Erweiterung?",
        antwort:
          "Kurz: erst was neu ist, dann was bleibt. Beispiel: „dieselbe Frau, gleiches Gesicht, gleiche Haare — jetzt stehend am Fenster, Morgenlicht, Ganzkörper“. Die Reihenfolge zählt: das Wichtigste zuerst.",
      },
      {
        frage: "Wie lang darf ein Prompt überhaupt sein?",
        antwort:
          "Kurz. Ein Prompt ist keine Beschreibung, sondern eine Anweisung. Bild: 40 bis 80 Wörter sind der süße Punkt. Ab etwa 150 verliert das Modell Details, weil sich die Angaben gegenseitig verwässern. Der Negativ-Prompt ist ein eigener Topf und zählt nicht mit.",
      },
    ],
  },
  {
    key: "serie",
    title: "Fotoserie statt Video",
    icon: Images,
    intro: "Der billigere Weg — und der, bei dem du sofort siehst, ob es stimmt.",
    entries: [
      {
        frage: "Kann ich eine Fotoserie machen statt eines Videos?",
        antwort:
          "Ja — und das ist meist der bessere Weg. Ein Video sind zehn Einzelbilder mit Bewegung. Eine Serie sind zehn Einzelbilder, die stehen. Billiger, schneller, und du siehst sofort, ob es stimmt.",
      },
      {
        frage: "Muss jede Aufnahme einen Prompt haben?",
        antwort:
          "Ja, aber kurz. Beim Ankerbild alles. Bei jeder weiteren Aufnahme nur das, was sich ändert — plus was bleiben soll.",
      },
      {
        frage: "Gibt es spezielle Modelle für Serien?",
        antwort:
          "Nein. Die Bearbeiten-Modelle machen das: Nano Banana Pro, FLUX.1 Kontext Pro, Seedream. Ein eigenes Serien-Modell gibt es nicht, weil die Gleichheit aus dem Ankerbild kommt.",
      },
    ],
  },
  {
    key: "zusammen",
    title: "Modelle zusammenarbeiten lassen",
    icon: Layers,
    intro: "Nacheinander ja, gleichzeitig nicht.",
    entries: [
      {
        frage: "Können zwei Modelle zusammenarbeiten?",
        antwort:
          "Nacheinander ja, gleichzeitig nicht. Eins baut das Bild, das nächste verfeinert es, ein drittes macht Bewegung. Jedes gibt an das nächste weiter.",
      },
      {
        frage: "Was ist die Kette für die Filme?",
        antwort:
          "Bild → Bewegung → Schnitt. Erst steht das Bild, dann kommt Bewegung hinein, dann wird geschnitten. Genau in dieser Reihenfolge — nie umgekehrt.",
      },
    ],
  },
  {
    key: "umgekehrt",
    title: "Umgekehrt: Bild zu Text",
    icon: ArrowLeftRight,
    intro: "Die Richtung, die funktioniert — und die, die es nicht gibt.",
    entries: [
      {
        frage: "Warum gibt es kein Modell, dem man den Prompt sagt und das sagt, was er bedeutet?",
        antwort:
          "Gibt es — und du hast es schon: den Bild-zu-Prompt im Prompt-Generator. Du gibst ein Bild hinein, heraus kommt die Beschreibung. Aber andersherum, also Text rein und Bedeutung raus, geht nicht: ein Modell versteht keine Bedeutung, es erkennt Muster. Deshalb funktioniert nur die Richtung, in der Wörter zu einem Bild führen.",
      },
      {
        frage: "Wofür ist der Bild-zu-Prompt gut?",
        antwort:
          "Um von einem Bild, das dir gefällt, auf die Wörter zu kommen. Du siehst, wie ein gutes Ergebnis beschrieben ist — und kannst dieselbe Sprache für deine eigenen Bilder benutzen.",
      },
    ],
  },
  {
    key: "geld",
    title: "Geld und Reihenfolge",
    icon: Coins,
    intro: "Wie du mit wenig Geld weit kommst — und in welcher Reihenfolge.",
    entries: [
      {
        frage: "Wie weit komme ich mit wenig Geld?",
        antwort:
          "Sehr weit — wenn du billig entwirfst und teuer veredelst. Das günstige Modell macht zwanzig Varianten, du suchst die beste aus, und nur die eine wird veredelt. So kosten zehn Versuche so viel wie früher einer.",
      },
      {
        frage: "In welcher Reihenfolge?",
        antwort: "Vier Schritte, immer in dieser Ordnung.",
        punkte: [
          "1. Entwerfen — günstig, viele Varianten. Z-Image-Turbo oder Qwen-Image-Lightning.",
          "2. Festnageln — die Person wird festgeschrieben: Gesicht, Körper, Haare. Über Ankerbild oder LoRA.",
          "3. Veredeln — dieselbe Frau, aber mit echtem Licht und echter Haut. Seedream oder Nano Banana Pro.",
          "4. Schärfen — 4K, Hautporen, kein Weichzeichnen. SUPIR oder SeedVR.",
        ],
      },
      {
        frage: "Wer geht wie weit — und wo endet jedes Modell?",
        antwort:
          "Jedes Modell geht genau so weit, wie seine Aufgabe reicht. Danach übernimmt das nächste. Keins macht alles — deshalb ist es eine Kette und keine Wahl.",
        punkte: [
          "Entwerfen (Z-Image-Turbo, Qwen-Lightning): weit in der Menge, nicht in der Nähe. Zwanzig Varianten in Minuten — aber das Gesicht wandert.",
          "Nano Banana Basis: so weit wie Pro, was das Gesicht angeht. Endet bei Schrift im Bild, 2K und mehreren Figuren.",
          "Nano Banana Pro: Schrift, 2K und 4K, mehrere Figuren auf einem Blatt. Endet bei extremer Treue über hunderte Bilder.",
          "FLUX.1 Kontext: bearbeitet ein vorhandenes Bild — dieselbe Person, neue Pose. Endet dort, wo du frei neu erfinden willst.",
          "Trainierter LoRA: geht am weitesten. Dieselbe Figur in jeder Pose, für 3 bis 5 Cent das Bild. Endet nur bei einem: gilt nur für dieses eine Gesicht.",
          "Schärfen (SUPIR, SeedVR): holt 4K und Hautporen heraus. Endet, wo das Bild selbst unscharf ist — aus Matsch wird kein Detail.",
        ],
        beispiel:
          "Auf fal.ai, Feld „5 Modelle“: die Zahl ist kein Rabatt.\nEst. 0,37 $ heißt 0,37 $ für einen Durchlauf über alle fünf — also rund 7 Cent je Modell.\nLieber eins nach dem anderen laufen lassen, dann weißt du, welches es war.",
      },
      {
        frage: "Was ist ein LoRA?",
        antwort:
          "Ein Zusatz, der einem Modell etwas beibringt — einen Stil oder ein Gesicht. Aus 10 bis 20 guten Bildern wird eine Figur, die in jeder Pose dieselbe bleibt. Einmal antrainiert, danach für immer verfügbar.",
      },
      {
        frage: "Wo finde ich das LoRA-Training — und was kostet es?",
        antwort:
          "Bei fal.ai, dort wo auch Nano Banana läuft. Zwei Angebote: „flux-lora-fast-training“ für rund 2 Dollar pro Durchlauf, und der neuere „flux-2-trainer“ für rund 6,40 Dollar bei 1000 Schritten. Du lädst 10 bis 20 Bilder derselben Figur als ZIP hoch und gibst ein Trigger-Wort an — ein Kunstwort wie „trnwoman“, das ab dann für diese Figur steht. Nach ein paar Minuten ist das Modell fertig und liegt dauerhaft bereit.",
        punkte: [
          "Der Preis hängt an der Zahl der Schritte, nicht an der Zahl der Bilder.",
          "Nimm als Trainingsbilder am besten welche, die du selbst mit Nano Banana erzeugt hast — dann gibt es kein Rechte-Problem mit echten Personen.",
          "Zehn bis zwanzig Bilder reichen. Mehr Bilder machen es nicht besser, nur langsamer.",
        ],
        beispiel:
          "fal.ai → fal-ai/flux-lora-fast-training\nimages_data_url: die ZIP-Datei mit 15 Bildern\ntrigger_word: trnwoman\nis_style: false\n→ fertig in wenigen Minuten, ca. 2 $",
      },
      {
        frage: "Ist das Basis-Modell gut genug — auch für einzelne Bilder?",
        antwort:
          "Ja. Nano Banana Basis ist dasselbe Modell wie Pro, nur ohne die Extras. Für ein einzelnes Bild einer Figur ist die Qualität gleich — der Unterschied liegt nicht im Gesicht, sondern im Beiwerk.",
        punkte: [
          "Basis, rund 0,039 $ pro Bild: normale Größe (1K), keine Schrift im Bild, eine Figur sicher.",
          "Pro, rund 0,15 $ pro Bild: Schrift und Logos im Bild, 2K und 4K, mehrere Figuren in einem Bild.",
          "Für alles, wo dieselbe Person bleiben soll, reicht die Basis völlig.",
        ],
      },
      {
        frage: "Was kostet es nach dem Training?",
        antwort:
          "Das Training zahlst du einmal. Danach kostet nur noch das Bild — und zwar weniger als bei Nano Banana.",
        punkte: [
          "FLUX.1 mit deinem LoRA: rund 0,03 bis 0,05 $ pro Bild.",
          "FLUX.1 schnell: rund 0,003 $ pro Megapixel — die billigste Masse überhaupt.",
          "Das trainierte Modell bleibt liegen, solange du es nicht löschst. Du kannst es also jederzeit wieder benutzen.",
        ],
      },
      {
        frage: "Was mache ich am besten mit 20 Dollar — und was bekomme ich dann?",
        antwort:
          "Erst den Charakter festnageln, dann Bilder machen. So bekommst du für 20 Dollar eine Figur, die für immer dieselbe bleibt, und dazu mehrere hundert Bilder.",
        punkte: [
          "2 $ — ein Charakter antrainieren (einmalig, für immer).",
          "0,15 $ — ein Charakter-Blatt mit vier Ansichten, um die Figur endgültig festzulegen.",
          "0,60 $ — vier Einzelbilder in voller Größe zum Zeigen.",
          "Rest, rund 17 $ — bei Nano Banana Basis etwa 440 Bilder, mit deinem trainierten LoRA etwa 570.",
        ],
        beispiel:
          "20 $ = 1 Charakter für immer + rund 440 Bilder.\n\nReihenfolge:\n1. Charakter-Blatt entwerfen (0,15 $)\n2. Die beste Ansicht als Ankerbild ins Archiv\n3. LoRA trainieren (2 $)\n4. Ab jetzt jedes Bild für 0,03–0,04 $",
      },
      {
        frage: "Ist es schlauer, mehrere Figuren in ein Bild zu packen?",
        antwort:
          "Zum Planen ja, zum Zeigen nein. Ein Blatt mit vier Ansichten kostet 0,15 $ statt 0,60 $ für vier einzelne — aber jede Figur bekommt nur ein Viertel der Bildpunkte. Für ein großes Bild wird das weich.",
        punkte: [
          "Blatt: entwerfen, ausprobieren, ins Archiv legen. Dafür ist Pro gebaut — es hält dasselbe Gesicht über mehrere Figuren.",
          "Einzelbild: das, was du wirklich zeigst. Immer in voller Größe.",
          "Zerteilen lohnt sich für Auswahlbilder, nicht für die Endfassung.",
        ],
        beispiel:
          "Erstelle ein Charakter-Blatt mit vier Ansichten derselben Frau aus dem Referenzbild: Frontal, Dreiviertel, Profil, Ganzkörper. Gleiches Gesicht, gleiche Frisur, gleiche Augenfarbe, neutrale Kleidung, gleichmäßiges Licht, einfarbiger grauer Hintergrund.",
      },
    ],
  },
];