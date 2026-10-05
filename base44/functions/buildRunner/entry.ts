import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Der Bau-Lauf: nimmt einen Auftrag aus dem Logbuch und führt aus, was sich
// ausführen lässt. Was Quelltext ändert, kann kein Programm von allein bauen —
// das wird als klarer Auftrag für den Baumeister mitgeschrieben, statt still zu
// verpuffen.

const WRITABLE = [
  'Creator',
  'Voice',
  'Content',
  'Hashtag',
  'Topic',
  'Idea',
  'CharacterModule',
  'Neigung',
  'PromptRule',
  'ImageArchive',
];

// Was jede Entität mindestens braucht — sonst scheitert das Anlegen.
const FIELDS = [
  'Creator: stageName, personaType (SOLO_MALE|SOLO_FEMALE|SHEMALE|COUPLE|GROUP)',
  'Voice: name, modelId, provider (ELEVENLABS|EXTERN)',
  'Content: creatorId, title, contentType (PHOTO|VIDEO|STORY|POST|BUNDLE|AUDIO|TEASER)',
  'Hashtag: name, meaning',
  'Topic: name',
  'Idea: title',
  'CharacterModule: title, kind (ROLLE|SITUATION|SZENARIO|ERSTELLUNG|IMPORT)',
  'Neigung: key, label',
  'PromptRule: title',
  'ImageArchive: url',
];

const SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          kind: { type: 'string' },
          note: { type: 'string' },
          entity: { type: 'string' },
          records: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                meaning: { type: 'string' },
                title: { type: 'string' },
                label: { type: 'string' },
                key: { type: 'string' },
                text: { type: 'string' },
                short: { type: 'string' },
                stageName: { type: 'string' },
                personaType: { type: 'string' },
                modelId: { type: 'string' },
                provider: { type: 'string' },
                url: { type: 'string' },
                kind: { type: 'string' },
                note: { type: 'string' },
                description: { type: 'string' },
                rule: { type: 'string' },
                contentType: { type: 'string' },
              },
            },
          },
          module: { type: 'string' },
        },
        required: ['kind', 'note'],
      },
    },
  },
  required: ['summary', 'steps'],
};

const planPrompt = (task) => `Du bist der Bau-Lauf des Logbuchs. Ein Auftrag liegt vor. Zerlege ihn in Schritte.

ERLAUBTE SCHRITTE:
- "create_records" — Datensätze anlegen. Felder: entity (genau eine von: ${WRITABLE.join(', ')}), records (Liste von Objekten mit den Feldern dieser Entität).

PFLICHTFELDER — jedes Objekt MUSS sie enthalten, sonst schlägt das Anlegen fehl:
${FIELDS.join('\n')}
- "hide_module" — einen Menüpunkt ausblenden. Feld: module (der Pfad, z. B. "/videos").
- "show_module" — einen Menüpunkt einblenden. Feld: module.
- "code" — alles, was den Quelltext der App ändert. Das kann der Lauf nicht ausführen. Feld: note (kurz und präzise, was gebaut werden muss).

REGELN:
- Nimm nur Schritte auf, die der Auftrag wirklich verlangt.
- Erfinde niemals Dateinamen.
- Verlangt der Auftrag neue Oberfläche, neue Logik oder Umbauten, nimm genau einen "code"-Schritt.
- summary: ein deutscher Satz, was der Lauf tun wird.

AUFTRAG:
"""${task.prompt || task.description || task.title}"""`;

const line = (text) => `${new Date().toISOString()} — ${text}`;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Nur der Besitzer darf Aufträge bauen.' }, { status: 403 });
    }

    const body = await req.json();
    const taskId = String(body?.taskId || '').trim();
    if (!taskId) return Response.json({ error: 'Kein Auftrag angegeben.' }, { status: 400 });

    const task = await base44.asServiceRole.entities.BuildTask.get(taskId);
    if (!task) return Response.json({ error: 'Auftrag nicht gefunden.' }, { status: 404 });

    const progress = [...(task.progress || []), line('Bau-Lauf gestartet.')];

    const plan = await base44.integrations.Core.InvokeLLM({
      prompt: planPrompt(task),
      response_json_schema: SCHEMA,
    });
    const steps = Array.isArray(plan?.steps) ? plan.steps : [];

    let openCode = false;
    let failed = false;

    for (const step of steps) {
      const kind = String(step?.kind || '').trim();
      try {
        if (kind === 'create_records') {
          const entity = String(step?.entity || '').trim();
          const records = Array.isArray(step?.records) ? step.records : [];
          if (!WRITABLE.includes(entity)) {
            progress.push(line(`Übersprungen: „${entity}" ist nicht freigegeben.`));
            continue;
          }
          if (!records.length) {
            progress.push(line(`Übersprungen: keine Datensätze für ${entity}.`));
            continue;
          }
          const made = await base44.asServiceRole.entities[entity].bulkCreate(records);
          progress.push(
            line(`${Array.isArray(made) ? made.length : records.length} Datensatz/Datensätze in ${entity} angelegt.`)
          );
        } else if (kind === 'hide_module' || kind === 'show_module') {
          const path = String(step?.module || '').trim();
          const layouts = await base44.asServiceRole.entities.SiteLayout.list('-updated_date', 1);
          const layout = layouts[0];
          if (!layout) {
            progress.push(line('Kein Layout gefunden — das Menü bleibt, wie es ist.'));
            continue;
          }
          const hidden = kind === 'hide_module';
          const navItems = (layout.navItems || []).map((i) => (i.path === path ? { ...i, hidden } : i));
          await base44.asServiceRole.entities.SiteLayout.update(layout.id, { navItems });
          progress.push(line(`Menüpunkt ${path} ${hidden ? 'ausgeblendet' : 'eingeblendet'}.`));
        } else if (kind === 'code') {
          openCode = true;
          progress.push(line(`Braucht den Baumeister: ${step?.note || task.title}`));
        } else {
          progress.push(line(`Unbekannter Schritt „${kind}" übersprungen.`));
        }
      } catch (error) {
        failed = true;
        progress.push(line(`Schritt „${kind}" fehlgeschlagen: ${error.message}`));
      }
    }

    if (!steps.length) progress.push(line('Der Lauf konnte keine Schritte ableiten.'));

    // Nichts gilt als fertig, was nicht wirklich gelaufen ist.
    const status = openCode || failed ? 'IN_ARBEIT' : 'FERTIG';
    progress.push(
      line(
        failed
          ? 'Mindestens ein Schritt ist nicht durchgelaufen — der Auftrag bleibt in Arbeit.'
          : openCode
            ? 'Der ausführbare Teil ist erledigt. Der Rest wartet auf den Baumeister.'
            : 'Alles ausgeführt — Auftrag fertig.'
      )
    );

    await base44.asServiceRole.entities.BuildTask.update(taskId, { status, progress });

    return Response.json({
      ok: true,
      status,
      progress,
      summary: plan?.summary || '',
      openCode,
      failed,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}