// Die Rechtstexte für ARTANIS × TANIA — gegliedert in Abschnitte, damit sie
// als eigene Seiten sauber lesbar sind.
//
// WICHTIG: Das sind Muster. Die anwaltliche Prüfung steht noch aus. Die Felder
// in eckigen Klammern müssen vom Betreiber ausgefüllt werden.

export const LEGAL_STAND = "Oktober 2026";

export const LEGAL_NOTICE =
  "ARTANIS × TANIA ist ein Angebot ausschließlich für Erwachsene ab 18 Jahren. Ohne bestätigte Volljährigkeit ist kein Zutritt möglich.";

const BETREIBER = {
  name: "[Vor- und Nachname bzw. Firma des Betreibers]",
  strasse: "[Straße und Hausnummer]",
  ort: "[Postleitzahl und Ort]",
  land: "[Land]",
  email: "[E-Mail-Adresse]",
  telefon: "[Telefonnummer]",
  ust: "[USt-IdNr., falls vorhanden]",
  vertreten: "[Name der vertretungsberechtigten Person]",
};

export const LEGAL_PAGES = [
  {
    id: "impressum",
    label: "Impressum",
    title: "Impressum",
    lead: "Anbieterkennzeichnung nach § 5 DDG (Digitale-Dienste-Gesetz).",
    sections: [
      {
        heading: "Diensteanbieter",
        body: [
          `${BETREIBER.name}`,
          `${BETREIBER.strasse}`,
          `${BETREIBER.ort}`,
          `${BETREIBER.land}`,
        ],
      },
      {
        heading: "Vertreten durch",
        body: [BETREIBER.vertreten],
      },
      {
        heading: "Kontakt",
        body: [`E-Mail: ${BETREIBER.email}`, `Telefon: ${BETREIBER.telefon}`],
      },
      {
        heading: "Umsatzsteuer-Identifikationsnummer",
        body: [
          `Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: ${BETREIBER.ust}`,
        ],
      },
      {
        heading: "Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV",
        body: [`${BETREIBER.vertreten}, Anschrift wie oben.`],
      },
      {
        heading: "Jugendschutz und Altersverifikation",
        body: [
          "ARTANIS × TANIA ist ein Angebot für Erwachsene. Der Zutritt setzt eine bestätigte Volljährigkeit (18 Jahre oder älter) voraus. Vor dem ersten Aufruf der Inhalte wird das Alter abgefragt und bestätigt; ohne diese Bestätigung werden keine Inhalte angezeigt.",
          "Der Betreiber behält sich vor, die Volljährigkeit im Einzelfall durch zusätzliche Nachweise zu überprüfen und Zugänge bei Zweifeln zu sperren.",
        ],
      },
      {
        heading: "Verbraucherstreitbeilegung",
        body: [
          "Der Betreiber ist nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
        ],
      },
      {
        heading: "Hinweis",
        body: [
          "Diese Anbieterkennzeichnung dient der Erfüllung gesetzlicher Informationspflichten. Sie stellt keine Rechtsberatung dar; die rechtliche Prüfung durch einen Rechtsanwalt steht noch aus.",
        ],
      },
    ],
  },

  {
    id: "datenschutz",
    label: "Datenschutz",
    title: "Datenschutzerklärung",
    lead: "Informationen zur Verarbeitung personenbezogener Daten nach Art. 13 und 14 DSGVO.",
    sections: [
      {
        heading: "1. Verantwortlicher",
        body: [
          `Verantwortlicher für die Datenverarbeitung ist ${BETREIBER.name}, ${BETREIBER.strasse}, ${BETREIBER.ort}, ${BETREIBER.land}, E-Mail: ${BETREIBER.email}.`,
        ],
      },
      {
        heading: "2. Grundsatz",
        body: [
          "Wir verarbeiten personenbezogene Daten nur, soweit das für die Bereitstellung eines funktionsfähigen Angebots, unserer Inhalte und Leistungen sowie zur Sicherheit erforderlich ist.",
          "ARTANIS × TANIA ist ausschließlich für volljährige Personen bestimmt. Daten von Minderjährigen werden nicht wissentlich erhoben.",
        ],
      },
      {
        heading: "3. Altersverifikation und Jugendschutz",
        body: [
          "Vor dem Zugang zu den Inhalten fragen wir ab, ob du 18 Jahre oder älter bist. Diese Bestätigung speichern wir — zusammen mit Datum und Uhrzeit —, um die gesetzlichen Jugendschutzanforderungen nachweisen zu können. Rechtsgrundlage ist unsere rechtliche Verpflichtung nach Art. 6 Abs. 1 lit. c DSGVO sowie unser berechtigtes Interesse an einem rechtssicheren Betrieb nach Art. 6 Abs. 1 lit. f DSGVO.",
          "Bei begründeten Zweifeln können zusätzliche Nachweise verlangt werden. Eine Kopie des Ausweises wird dabei nicht gespeichert; geprüft wird nur, ob die Volljährigkeit bestätigt ist.",
        ],
      },
      {
        heading: "4. Welche Daten wir verarbeiten",
        list: [
          "Kontodaten: E-Mail-Adresse, Anzeigename, Passwort (verschlüsselt gespeichert), Rolle und Mitgliedsstatus.",
          "Profildaten: Angaben, die du selbst machst — etwa Geschlecht, Interessen, Beschreibung, Profilbild und weitere freiwillige Angaben.",
          "Inhaltsdaten: von dir eingegebene Texte, Chats, Anfragen, Wünsche, Storys sowie von dir hochgeladene Bilder und Audiodateien.",
          "Nutzungsdaten: technisch notwendige Protokolldaten wie Zeitpunkt des Zugriffs, aufgerufene Bereiche, Geräte- und Browserangaben sowie Fehlerprotokolle.",
          "Zahlungsdaten: Informationen zu gebuchten Leistungen, Bestellungen und Transaktionen.",
        ],
      },
      {
        heading: "5. Zahlungen",
        body: [
          "Für Zahlungen nutzen wir einen externen Zahlungsdienstleister. Die Zahlung wird auf dessen Seiten abgewickelt. Vollständige Zahlungsdaten wie Kartennummern werden uns nicht übermittelt und nicht bei uns gespeichert. Wir erhalten lediglich die Information, ob und welche Leistung bezahlt wurde.",
          "Für die Abwicklung ist der Zahlungsdienstleister eigener Verantwortlicher; es gilt zusätzlich dessen Datenschutzerklärung.",
        ],
      },
      {
        heading: "6. KI-gestützte Funktionen",
        body: [
          "Ein Teil des Angebots wird mit Hilfe von KI-Modellen erzeugt: Texte im Chat, Storys, Beschreibungen, Stimmen und Bilder. Dafür werden die von dir eingegebenen Inhalte — etwa dein Chatverlauf oder dein Szenario — an den jeweiligen Dienst übermittelt und dort verarbeitet.",
          "Wir weisen an jeder Stelle darauf hin, wenn du mit einer KI und nicht mit einer echten Person sprichst. Bitte gib dort keine sensiblen Daten ein, die du nicht teilen möchtest. Rechtsgrundlage ist die Erfüllung des Vertrags nach Art. 6 Abs. 1 lit. b DSGVO sowie deine Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO, soweit du eine Funktion freiwillig nutzt.",
        ],
      },
      {
        heading: "7. Hochgeladene Medien",
        body: [
          "Von dir hochgeladene Bilder und Audiodateien werden in einem geschützten Speicher abgelegt und nur über zeitlich begrenzte, signierte Zugriffslinks ausgeliefert. Ein öffentlicher Direktlink besteht nicht. Zugriff haben nur du und — soweit für den Betrieb erforderlich — der Betreiber.",
        ],
      },
      {
        heading: "8. Cookies und lokale Speicherung",
        body: [
          "Wir verwenden technisch notwendige Cookies und den lokalen Speicher deines Browsers, damit die Anmeldung funktioniert und deine Einstellungen — etwa Altersbestätigung, Favoriten und Anzeigeoptionen — erhalten bleiben.",
          "Auf Werbe- und Marketing-Tracker von Drittanbietern verzichten wir. Details findest du in der Seite „Widerruf & Cookies“.",
        ],
      },
      {
        heading: "9. Rechtsgrundlagen",
        list: [
          "Art. 6 Abs. 1 lit. a DSGVO — Einwilligung, etwa bei freiwilligen Angaben und KI-Funktionen.",
          "Art. 6 Abs. 1 lit. b DSGVO — Vertragserfüllung, etwa Konto, Chat, Bestellungen.",
          "Art. 6 Abs. 1 lit. c DSGVO — rechtliche Verpflichtung, etwa Altersverifikation und Aufbewahrung.",
          "Art. 6 Abs. 1 lit. f DSGVO — berechtigtes Interesse an sicherem Betrieb, Missbrauchsabwehr und Fehlerbehebung.",
        ],
      },
      {
        heading: "10. Empfänger der Daten",
        body: [
          "Daten erhalten nur Stellen, die sie zur Erfüllung ihrer Aufgabe brauchen: unser Hosting- und Plattformanbieter für den technischen Betrieb, der Zahlungsdienstleister für die Abwicklung von Zahlungen sowie die Anbieter der KI-Dienste für die Erzeugung von Texten, Stimmen und Bildern.",
          "Eine Weitergabe zu Werbezwecken an Dritte findet nicht statt. Eine Übermittlung in Länder außerhalb der EU kann stattfinden, soweit der jeweilige Dienst dort betrieben wird; in diesem Fall stützen wir uns auf die Standardvertragsklauseln der EU-Kommission.",
        ],
      },
      {
        heading: "11. Speicherdauer",
        body: [
          "Wir speichern deine Daten, solange dein Konto besteht. Löschst du dein Konto, werden die personenbezogenen Daten gelöscht oder anonymisiert, soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen (etwa handels- und steuerrechtliche Fristen für Zahlungsbelege).",
          "Die Bestätigung der Volljährigkeit bewahren wir für die Dauer der gesetzlichen Nachweispflichten auf.",
        ],
      },
      {
        heading: "12. Deine Rechte",
        list: [
          "Auskunft über die zu deiner Person verarbeiteten Daten (Art. 15 DSGVO).",
          "Berichtigung unrichtiger oder unvollständiger Daten (Art. 16 DSGVO).",
          "Löschung deiner Daten (Art. 17 DSGVO).",
          "Einschränkung der Verarbeitung (Art. 18 DSGVO).",
          "Datenübertragbarkeit in einem gängigen Format (Art. 20 DSGVO).",
          "Widerspruch gegen die Verarbeitung (Art. 21 DSGVO).",
          "Widerruf einer erteilten Einwilligung mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO).",
        ],
      },
      {
        heading: "13. Beschwerderecht",
        body: [
          "Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren — etwa bei der Behörde deines gewöhnlichen Aufenthaltsorts oder der für den Betreiber zuständigen Aufsichtsbehörde.",
        ],
      },
      {
        heading: "14. Datensicherheit",
        body: [
          "Wir schützen deine Daten durch technische und organisatorische Maßnahmen: verschlüsselte Übertragung, Zugriffsbeschränkungen und geschützter Speicher für Uploads. Ein vollständiger Schutz gegen alle Angriffe ist technisch nicht möglich.",
        ],
      },
      {
        heading: "15. Hinweis",
        body: [
          "Diese Datenschutzerklärung ist ein Muster und dient der Information. Die anwaltliche Prüfung steht noch aus. Sie stellt keine Rechtsberatung dar.",
        ],
      },
    ],
  },

  {
    id: "agb",
    label: "Nutzungsbedingungen",
    title: "Nutzungsbedingungen (AGB)",
    lead: "Für die Nutzung von ARTANIS × TANIA.",
    sections: [
      {
        heading: "1. Geltungsbereich",
        body: [
          `Diese Nutzungsbedingungen gelten für die Nutzung des Angebots ARTANIS × TANIA, betrieben von ${BETREIBER.name} (nachfolgend „Betreiber“).`,
          "Mit der Anmeldung und Nutzung erkennst du diese Bedingungen an. Abweichende Bedingungen des Nutzers gelten nicht, es sei denn, der Betreiber stimmt ausdrücklich zu.",
        ],
      },
      {
        heading: "2. Zutritt erst ab 18 Jahren",
        body: [
          "Das Angebot richtet sich ausschließlich an volljährige Personen. Mit der Altersbestätigung versicherst du, mindestens 18 Jahre alt zu sein, und bestätigst, dass der Aufruf der Inhalte an deinem Aufenthaltsort zulässig ist.",
          "Stellt sich heraus, dass diese Voraussetzung nicht erfüllt ist, wird der Zugang ohne Anspruch auf Erstattung gesperrt und das Konto gelöscht.",
        ],
      },
      {
        heading: "3. Vertragsschluss und Konto",
        body: [
          "Der Vertrag über die Nutzung kommt mit der Einrichtung eines Kontos zustande. Für einzelne Leistungen kommt der Vertrag mit der Bestellung bzw. Zahlung zustande.",
          "Du bist verpflichtet, deine Zugangsdaten geheim zu halten und uns unverzüglich zu informieren, wenn du einen Missbrauch vermutest. Ein Konto ist nicht übertragbar.",
        ],
      },
      {
        heading: "4. Leistungen des Betreibers",
        body: [
          "Der Betreiber stellt eine digitale Plattform bereit: Storys und interaktive Erlebnisse, Chats und Sprechstunden mit KI-Figuren, Bilder, Videos, Stimmen, Community-Bereiche sowie Werkzeuge für eigene Inhalte.",
          "Ein Teil der Inhalte wird mit KI erzeugt. Der Betreiber weist darauf hin, wenn du mit einer KI und nicht mit einer echten Person sprichst. KI-Inhalte können unrichtig, unerwartet oder unpassend ausfallen; ein bestimmter Erfolg oder eine bestimmte inhaltliche Qualität wird nicht geschuldet.",
          "Der Betreiber darf das Angebot weiterentwickeln, einzelne Funktionen ändern oder einstellen, soweit dies für den Nutzer zumutbar ist.",
        ],
      },
      {
        heading: "5. Preise, Coins und Zahlung",
        body: [
          "Kostenpflichtige Leistungen sind vor der Bestellung mit Preis ausgewiesen. Die Zahlung erfolgt über den eingebundenen Zahlungsdienstleister.",
          "Coins und Guthaben sind reine Nutzungsguthaben innerhalb der Plattform. Sie sind nicht übertragbar, nicht auszahlbar und werden nicht in Geld erstattet. Gesetzliche Rechte bei Mängeln bleiben unberührt.",
          "Der Betreiber kann Preise für die Zukunft ändern. Bereits bezahlte Leistungen bleiben unberührt.",
        ],
      },
      {
        heading: "6. Nutzungsrechte an Inhalten",
        body: [
          "Der Betreiber räumt dir ein einfaches, nicht übertragbares Recht ein, die Inhalte für private Zwecke zu nutzen. Eine Weitergabe, Veröffentlichung, Vervielfältigung oder kommerzielle Nutzung ist ohne Zustimmung nicht erlaubt.",
          "Lädst du eigene Inhalte hoch, bleibst du Inhaber der Rechte. Du räumst dem Betreiber das Recht ein, diese Inhalte zum Betrieb der Plattform zu speichern, technisch zu verarbeiten und dir anzuzeigen.",
        ],
      },
      {
        heading: "7. Verbotene Inhalte und Verhalten",
        body: [
          "Verboten sind insbesondere folgende Inhalte und Handlungen:",
        ],
        list: [
          "Inhalte mit Minderjährigen in sexuellem Zusammenhang — dies führt zur sofortigen Sperrung und Strafanzeige.",
          "Darstellungen realer Personen in sexuellem Zusammenhang ohne deren nachweisbare Einwilligung.",
          "Inhalte, die Gewalt verherrlichen, zu Straftaten auffordern, Hass verbreiten oder andere herabwürdigen.",
          "Anbahnung oder Verkauf sexueller Dienstleistungen sowie die Verabredung entgeltlicher Treffen.",
          "Belästigung, Bedrohung, Erpressung, Identitätsmissbrauch oder das Ausspähen anderer Nutzer.",
          "Automatisierter Massenabruf, Umgehung von Sicherheitsmaßnahmen, Vervielfältigung oder Weiterverkauf des Angebots.",
        ],
      },
      {
        heading: "8. Sperrung und Kündigung",
        body: [
          "Du kannst dein Konto jederzeit löschen. Der Betreiber kann den Zugang sperren oder kündigen, wenn gegen diese Bedingungen verstoßen wird — bei schweren Verstößen sofort und ohne Erstattung.",
          "Bereits erworbene Coins und Guthaben verfallen bei einer Sperrung wegen vorsätzlichen Verstoßes.",
        ],
      },
      {
        heading: "9. Widerrufsrecht bei digitalen Inhalten",
        body: [
          "Verbrauchern steht grundsätzlich ein Widerrufsrecht zu. Bei digitalen Inhalten erlischt das Widerrufsrecht, wenn der Betreiber mit der Ausführung begonnen hat, nachdem du ausdrücklich zugestimmt hast und bestätigt hast, dass du dein Widerrufsrecht damit verlierst.",
          "Das gilt entsprechend für Coins und Guthaben, die sofort nach dem Kauf nutzbar sind. Einzelheiten regelt die Seite „Widerruf & Cookies“.",
        ],
      },
      {
        heading: "10. Haftung",
        body: [
          "Der Betreiber haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Verletzung von Leben, Körper oder Gesundheit. Bei einfacher Fahrlässigkeit haftet er nur bei Verletzung einer wesentlichen Vertragspflicht und begrenzt auf den vorhersehbaren, vertragstypischen Schaden.",
          "Für Inhalte, die Nutzer selbst einstellen, haftet der jeweilige Nutzer. Einzelheiten regelt der Haftungsausschluss.",
        ],
      },
      {
        heading: "11. Änderungen dieser Bedingungen",
        body: [
          "Der Betreiber kann diese Bedingungen ändern, wenn dies aus rechtlichen oder technischen Gründen erforderlich ist. Änderungen werden vorab mitgeteilt. Widersprichst du nicht innerhalb von vier Wochen, gelten sie als angenommen.",
        ],
      },
      {
        heading: "12. Anwendbares Recht und Gerichtsstand",
        body: [
          "Es gilt deutsches Recht. Zwingende Verbraucherschutzvorschriften des Aufenthaltsstaats bleiben unberührt. Gerichtsstand ist der Sitz des Betreibers, soweit gesetzlich zulässig.",
        ],
      },
      {
        heading: "13. Hinweis",
        body: [
          "Diese Nutzungsbedingungen sind ein Muster und dienen der Information. Die anwaltliche Prüfung steht noch aus.",
        ],
      },
    ],
  },

  {
    id: "haftung",
    label: "Haftungsausschluss",
    title: "Haftungsausschluss",
    lead: "Hinweise zur Haftung, zu KI-Inhalten und zu Inhalten Dritter.",
    sections: [
      {
        heading: "1. Haftung für eigene Inhalte",
        body: [
          "Die Inhalte dieser Plattform werden mit Sorgfalt erstellt. Für Richtigkeit, Vollständigkeit und Aktualität wird jedoch keine Gewähr übernommen.",
          "Als Diensteanbieter sind wir für eigene Inhalte nach den allgemeinen Gesetzen verantwortlich, jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung von Informationen nach den allgemeinen Gesetzen bleiben davon unberührt.",
        ],
      },
      {
        heading: "2. KI-generierte Inhalte",
        body: [
          "Ein wesentlicher Teil der Inhalte — Texte, Chatverläufe, Storys, Stimmen, Bilder und Videos — wird mit KI erzeugt. Solche Inhalte sind fiktiv. Sie können unrichtig, unvollständig, unerwartet oder unpassend sein und sind nicht als Tatsachenbehauptung, Empfehlung oder Beratung zu verstehen.",
          "An jeder Stelle, an der du mit einer KI sprichst, machen wir dies kenntlich. Treffen auf Grundlage KI-generierter Inhalte liegt in deiner eigenen Verantwortung.",
        ],
      },
      {
        heading: "3. Keine medizinische oder psychotherapeutische Leistung",
        body: [
          "Die Funktionen „Sprechstunde“ und vergleichbare Formate sind Unterhaltungsangebote mit KI-Figuren. Sie sind ausdrücklich keine Psychotherapie, keine medizinische Behandlung und keine Beratung. Sie ersetzen keine professionelle Hilfe.",
          "Bei gesundheitlichen Beschwerden, psychischen Krisen oder in Notfällen wende dich bitte an einen Arzt, eine Ärztin oder den Notruf (112) bzw. die Telefonseelsorge.",
        ],
      },
      {
        heading: "4. Inhalte von Nutzern",
        body: [
          "Für Inhalte, die Nutzer selbst einstellen oder eingeben — etwa Community-Beiträge, Kommentare, Wünsche, Bilder oder Chatnachrichten —, ist der jeweilige Nutzer verantwortlich. Der Betreiber macht sich diese Inhalte nicht zu eigen.",
          "Rechtswidrige Inhalte werden nach Kenntnisnahme unverzüglich entfernt. Ein Anspruch darauf, dass jeder Beitrag vorab geprüft wird, besteht nicht.",
        ],
      },
      {
        heading: "5. Inhalte für Erwachsene",
        body: [
          "Diese Plattform enthält Inhalte, die ausschließlich für Erwachsene bestimmt sind. Der Zutritt ist erst nach bestätigter Volljährigkeit möglich. Wer den Zugang nutzt, obwohl die Voraussetzungen nicht vorliegen, handelt auf eigenes Risiko.",
        ],
      },
      {
        heading: "6. Externe Links",
        body: [
          "Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Für diese fremden Inhalte wird keine Gewähr übernommen. Verantwortlich ist der jeweilige Anbieter oder Betreiber der Seiten. Zum Zeitpunkt der Verlinkung waren keine rechtswidrigen Inhalte erkennbar.",
        ],
      },
      {
        heading: "7. Verfügbarkeit",
        body: [
          "Eine ununterbrochene Verfügbarkeit der Plattform wird nicht zugesichert. Wartungsarbeiten, technische Störungen und höhere Gewalt können zu Unterbrechungen führen.",
        ],
      },
      {
        heading: "8. Urheberrecht",
        body: [
          "Die auf dieser Plattform erstellten Inhalte und Werke unterliegen dem Urheberrecht. Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung. Downloads und Kopien sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.",
        ],
      },
      {
        heading: "9. Hinweis",
        body: [
          "Dieser Haftungsausschluss ist ein Muster und dient der Information. Die anwaltliche Prüfung steht noch aus.",
        ],
      },
    ],
  },

  {
    id: "widerruf",
    label: "Widerruf & Cookies",
    title: "Widerrufsbelehrung & Cookies",
    lead: "Dein Widerrufsrecht und der Umgang mit Cookies und lokalem Speicher.",
    sections: [
      {
        heading: "A. Widerrufsbelehrung",
        body: [
          "Verbrauchern steht ein Widerrufsrecht nach folgender Maßgabe zu.",
        ],
      },
      {
        heading: "Widerrufsrecht",
        body: [
          "Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses.",
          `Um dein Widerrufsrecht auszuüben, musst du uns (${BETREIBER.name}, ${BETREIBER.strasse}, ${BETREIBER.ort}, ${BETREIBER.land}, E-Mail: ${BETREIBER.email}) mittels einer eindeutigen Erklärung — etwa einem Brief oder einer E-Mail — über deinen Entschluss informieren, diesen Vertrag zu widerrufen. Du kannst dafür das untenstehende Muster verwenden, das aber nicht vorgeschrieben ist.`,
          "Zur Wahrung der Widerrufsfrist reicht es aus, dass du die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absendest.",
        ],
      },
      {
        heading: "Folgen des Widerrufs",
        body: [
          "Wenn du diesen Vertrag widerrufst, haben wir dir alle Zahlungen, die wir von dir erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über deinen Widerruf bei uns eingegangen ist. Für die Rückzahlung verwenden wir dasselbe Zahlungsmittel, das du bei der ursprünglichen Transaktion eingesetzt hast, es sei denn, mit dir wurde ausdrücklich etwas anderes vereinbart.",
        ],
      },
      {
        heading: "Vorzeitiges Erlöschen des Widerrufsrechts",
        body: [
          "Das Widerrufsrecht erlischt bei einem Vertrag über die Lieferung von digitalen Inhalten, die nicht auf einem körperlichen Datenträger geliefert werden, wenn wir mit der Ausführung des Vertrags begonnen haben, nachdem du ausdrücklich zugestimmt hast und gleichzeitig bestätigt hast, dass du dein Widerrufsrecht mit Beginn der Vertragsausführung verlierst.",
          "Bei Coins und Guthaben, die unmittelbar nach dem Kauf nutzbar sind, gilt dasselbe: Mit dem ersten Einsatz erlischt das Widerrufsrecht für den eingesetzten Betrag.",
        ],
      },
      {
        heading: "Muster-Widerrufsformular",
        body: [
          "An: [Betreiber, Anschrift, E-Mail-Adresse] — Hiermit widerrufe ich den von mir abgeschlossenen Vertrag über den Kauf der folgenden Leistung: [Bezeichnung]. Bestellt am: [Datum]. Name: [Name]. Anschrift: [Anschrift]. Datum und Unterschrift: [Datum, Unterschrift].",
        ],
      },

      {
        heading: "B. Cookies und lokaler Speicher",
        body: [
          "Wir verwenden ausschließlich technisch notwendige Cookies und den lokalen Speicher deines Browsers. Diese sind erforderlich, damit die Plattform funktioniert.",
        ],
      },
      {
        heading: "Wofür wir sie brauchen",
        list: [
          "Anmeldung und Sitzung: damit du angemeldet bleibst und sicher bist.",
          "Altersbestätigung: damit wir nicht bei jedem Aufruf erneut fragen müssen.",
          "Einstellungen: gewählte Anzeige, Favoriten und persönliche Vorlieben.",
          "Sicherheit: Schutz vor Missbrauch und Erkennung fehlerhafter Zugriffe.",
        ],
      },
      {
        heading: "Was wir nicht verwenden",
        body: [
          "Wir setzen keine Werbe- und Marketing-Tracker von Drittanbietern ein. Es findet kein Profiling zu Werbezwecken und kein Verkauf von Daten statt.",
        ],
      },
      {
        heading: "Cookies verwalten",
        body: [
          "Du kannst Cookies und den lokalen Speicher jederzeit in deinem Browser löschen oder blockieren. Beachte: Ohne technisch notwendige Cookies funktionieren Anmeldung und Altersbestätigung nicht, und die Plattform kann nicht genutzt werden.",
        ],
      },
      {
        heading: "Hinweis",
        body: [
          "Diese Widerrufsbelehrung und die Cookie-Informationen sind Muster und dienen der Information. Die anwaltliche Prüfung steht noch aus.",
        ],
      },
    ],
  },
];

export const legalPage = (id) => LEGAL_PAGES.find((p) => p.id === id) || null;