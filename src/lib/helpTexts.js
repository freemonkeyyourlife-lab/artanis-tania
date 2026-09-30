// Feste Schritt-für-Schritt-Erklärungen — pro Stelle genau das, was du dort wissen musst.
export const HELP = {
  stimmbank: {
    title: "Die Stimmbank",
    steps: [
      "Hier liegen alle Stimmen, die deine Charaktere sprechen können.",
      "„Neue Stimme“: eine eigene anlegen — Grundstimme wählen, Stimmung und Tempo einstellen, oder eine Aufnahme hochladen und klonen.",
      "„Aus ElevenLabs“: holt die Stimmen aus deinem ElevenLabs-Konto hierher.",
      "„Bearbeiten“: jede Stimme kannst du jederzeit nachbearbeiten — Name, Stimmung, Tempo, Tiefe, Aufnahme.",
      "Stern = Favorit. „Freigeben“ = andere dürfen sie auch nutzen. Unten links ordnest du sie einem Charakter zu.",
      "„Anhören“ spielt die Stimme genau so, wie sie im Chat klingt.",
    ],
  },
  elevenlabsKey: {
    title: "Der ElevenLabs-Schlüssel",
    steps: [
      "Bei ElevenLabs: links unten „Developers“ → „API Keys“ → deinen Schlüssel bearbeiten (oder neu anlegen).",
      "„Text zu Sprache“ → auf „Zugriff“ stellen. Damit spricht die Stimme.",
      "„Stimmen“ → auf „Schreiben“ stellen (schließt „Gelesen“ mit ein). Damit siehst du deine Stimmen und kannst klonen.",
      "Alle anderen Zeilen dürfen auf „Kein Zugang“ bleiben.",
      "Unten „Speichern“. War es ein neuer Schlüssel: im Base44-Dashboard unter „Secrets“ den Wert von ELEVENLABS_API_KEY ersetzen.",
      "Danach hier „Neu laden“ drücken.",
      "Den Schlüssel niemals in Chats oder Nachrichten schicken — wer ihn hat, verbraucht dein Guthaben.",
    ],
  },
  sprachnachrichten: {
    title: "Sprachnachrichten im Chat",
    steps: [
      "Das gilt für Chats, die über Telegram laufen — im Leitstand erkennst du sie am Gastnamen.",
      "Chat öffnen: oben über dem Eingabefeld sitzt die Sprach-Zeile.",
      "Stimme wählen: das Auswahlfeld links. Darin stehen alle ElevenLabs-Stimmen aus deiner Stimmbank — mit genau dem Klang (Tonlage, Intensität, Tempo), den du dort eingestellt hast.",
      "Ist die Liste leer, liegt noch keine ElevenLabs-Stimme in der Stimmbank: Studio → Stimmbank → „Aus ElevenLabs“ → Stimmen übernehmen.",
      "Häkchen „Jede Antwort zusätzlich als Sprachnachricht“: ab dann bekommt der Gast jede Antwort, die du hier schreibst, als Text und als Sprachnachricht.",
      "Der Mikrofon-Knopf neben dem Senden schickt die getippte Zeile sofort nur als Sprachnachricht — ohne Text daneben. Dafür muss oben eine Stimme gewählt sein.",
      "Ohne Häkchen und ohne Mikrofon geht alles wie bisher als Text raus.",
      "Jede Sprachnachricht verbraucht ElevenLabs-Guthaben — das Häkchen also nur einschalten, wo du es wirklich willst.",
    ],
  },
  elevenlabsImport: {
    title: "Stimmen aus ElevenLabs holen",
    steps: [
      "„Stimmen anzeigen“ drücken — die Liste kommt direkt aus deinem ElevenLabs-Konto.",
      "Einzeln „Übernehmen“ oder alle auf einmal.",
      "Übernommene Stimmen stehen danach in der Stimmbank und lassen sich wie jede andere bearbeiten.",
      "Kommt ein Fehler oder eine leere Liste: dem Schlüssel fehlt die Erlaubnis „Stimmen: Gelesen“ — siehe Erklärung zum Schlüssel.",
    ],
  },
  stimmeBearbeiten: {
    title: "Eine Stimme einstellen",
    steps: [
      "Name und Beschreibung: nur für dich, damit du sie wiederfindest.",
      "Grundstimme: der Klang, falls keine eigene Aufnahme oder ElevenLabs-Stimme dran hängt.",
      "Stimmung: „Sanft“ ruhig und gleichmäßig, „Verführerisch“ und „Heiß“ mit mehr Ausdruck, „Ernst“ und „Hart“ bestimmter.",
      "Tempo: nach links langsamer, nach rechts schneller. 1,0 ist normal.",
      "Tiefe: macht die Grundstimme tiefer oder heller (wirkt nicht bei ElevenLabs-Stimmen).",
      "„Anhören“ spielt immer die aktuellen Einstellungen. Passt es, unten „Speichern“.",
    ],
  },
  stimmeKlonen: {
    title: "Eigene Stimme klonen",
    steps: [
      "Eine saubere Aufnahme hochladen oder direkt einsprechen — 1 bis 3 Minuten, ohne Musik, ohne Hall, nur eine Person.",
      "„Als eigene Stimme klonen“ drücken. ElevenLabs baut daraus eine Stimme.",
      "Danach Stimmung und Tempo einstellen und speichern — fertig, die Stimme spricht jeden Text.",
      "Klingt es nicht gut: bessere Aufnahme hochladen und „Neu klonen“.",
      "Nur Stimmen klonen, für die du die Einwilligung der Person hast.",
      "Braucht beim Schlüssel „Stimmen: Schreiben“.",
    ],
  },
};