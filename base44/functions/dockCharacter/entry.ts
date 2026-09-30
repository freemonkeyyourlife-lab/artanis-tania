import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Aus einer fremden Seite nur den lesbaren Text holen.
function stripHtml(html: string) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Nicht angemeldet.' }, { status: 401 });

    const body = await req.json();
    const text = String(body?.text || '').trim();
    const sourceUrl = String(body?.sourceUrl || '').trim();
    const fileUrl = String(body?.fileUrl || '').trim();
    const personaText = String(body?.personaText || '').trim();
    const personaLabel = String(body?.personaLabel || '').trim();
    const blendStrength = Number(body?.blendStrength ?? 60);

    // Alles, was reinkommt, zu lesbarem Material machen.
    let material = text;
    if (sourceUrl) {
      try {
        const res = await fetch(sourceUrl);
        if (res.ok) {
          const raw = await res.text();
          material += (material ? '\n\n' : '') + stripHtml(raw).slice(0, 14000);
        }
      } catch (e) {
        console.error('Link nicht erreichbar:', sourceUrl);
      }
    }
    const fileUrls = fileUrl ? [fileUrl] : [];

    if (!material && fileUrls.length === 0) {
      return Response.json({ error: 'Es kam nichts an, was wir lesen konnten. Füg Text ein oder leg eine Datei rein.' }, { status: 400 });
    }

    const foundation = personaText
      ? `═══ UNSERE PERSÖNLICHKEIT — DAS FUNDAMENT ═══\n${personaText}\n═══ ENDE FUNDAMENT ═══`
      : '═══ KEIN FUNDAMENT — der Charakter steht ganz für sich allein. ═══';

    const prompt = `Du baust auf einer deutschen 18+-Plattform einen fertigen Charakter zusammen, mit dem Nutzer ab sofort chatten können.

Jemand bringt seinen EIGENEN Charakter mit (Beschreibung, Datei oder Link). Wir mischen ihn mit unserer Haus-Persönlichkeit "${personaLabel || 'keine'}" — Mischstärke ${blendStrength} von 100.

═══ SEIN CHARAKTER — DAS MATERIAL ═══
${material || '(Der Charakter steckt in der angehängten Datei — lies sie vollständig aus.)'}
═══ ENDE MATERIAL ═══

${foundation}

AUFGABE:
1. Lies aus dem Material ALLES heraus, was diesen Charakter ausmacht: Name, Aussehen, Wesen, Vorgeschichte, Vorlieben, Sprache, Eigenheiten. Steckt das Material in einer Datei (Charakterkarte, JSON, Bild, PDF), nutze sie vollständig.
2. Baue daraus EINEN Charakter, der auf unserem Fundament läuft: TON, HALTUNG, TEMPO, VERHALTENSREGELN und der Umgang mit dem Nutzer kommen von uns — GESICHT, GESCHICHTE, VORLIEBEN, SPRACHE und EIGENHEITEN kommen von ihm.
3. Mischstärke ${blendStrength}/100: bei 0 steht sein Charakter komplett allein, bei 100 dominiert unsere Persönlichkeit. Dazwischen verschmelzen beide: er bleibt erkennbar er selbst, aber er spricht und verhält sich in unserem Stil.
4. Alle Beteiligten sind volljährig. Wenn das Material anderes andeutet, verwerfe es.
5. Schreibe "personaPrompt" als vollständige, sofort einsetzbare Anweisung an die KI — auf Deutsch, in der Du-Form, mindestens 1500 Zeichen. Sie muss enthalten: wer der Charakter ist, wie er aussieht, wie er spricht, was er will, wie er sich gegenüber dem Nutzer verhält, wie er auf Nähe reagiert, wie er sich langsam steigert, und die Regeln unseres Fundaments. Kein Vorwort, keine Erklärung — nur die Anweisung selbst.
6. Sind mehrere Personen im Charakter (Paar, Gruppe): beschreibe jede einzeln und lege fest, dass jede gesprochene Zeile mit dem Namen in eckigen Klammern beginnt.
7. "greeting" ist der erste Satz, mit dem der Charakter den Nutzer begrüßt — deutsch, in-character, höchstens zwei Sätze.
8. Erfinde nichts dazu, was dem Material widerspricht. Fehlt eine Angabe, entscheide stimmig im Sinne des Charakters.`;

    const character = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: fileUrls.length ? fileUrls : undefined,
      response_json_schema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Der Name des Charakters' },
          tagline: { type: 'string', description: 'Ein Satz, der ihn auf den Punkt bringt' },
          summary: { type: 'string', description: 'Kurze Zusammenfassung, 2-3 Sätze' },
          personality: { type: 'string', description: 'Wesen und Eigenheiten, 3-6 Sätze' },
          appearance: { type: 'string', description: 'Aussehen, 1-3 Sätze' },
          greeting: { type: 'string', description: 'Der erste Satz, mit dem er den Nutzer begrüßt' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Bis zu 8 kurze Schlagworte' },
          personaPrompt: { type: 'string', description: 'Die vollständige Anweisung an die KI, mindestens 1500 Zeichen' },
        },
        required: ['name', 'tagline', 'personality', 'personaPrompt'],
      },
    });

    return Response.json({ character });
  } catch (error) {
    console.error('dockCharacter failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}