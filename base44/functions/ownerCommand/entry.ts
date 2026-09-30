import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

// Zentrale Befehls-Eingabe für den Godmode. Zwei Schritte:
// 1. Ohne "confirm": den deutschen Satz in eine erlaubte Aktion übersetzen und prüfen.
// 2. Mit "confirm": dieselbe Aktion noch einmal prüfen und erst dann ausführen.
// Die Besitzerrechte werden hier serverseitig an der echten Identität geprüft —
// kein Textbefehl und kein Schalter im Browser kann das umgehen.

const PERSONA_TYPES = ['SOLO_MALE', 'SOLO_FEMALE', 'SHEMALE', 'COUPLE', 'GROUP'];
const BASE_VOICES = ['river', 'honey', 'sunny', 'storm', 'spark'];
const MOODS = ['NEUTRAL', 'SANFT', 'VERFUEHRERISCH', 'HEISS', 'SPIELERISCH', 'ERNST', 'HART'];
const PANELS = ['chat', 'bot', 'bot2', 'share'];

// Persönliche, jederzeit umkehrbare Fenster-Befehle — die führt die App direkt aus.
const PERSONAL_ACTIONS = ['open_panel', 'hide_panel', 'move_panel', 'set_text_size', 'set_call_voice'];
// Globale Änderungen — die werden vorher gezeigt und bewusst bestätigt.
const GLOBAL_ACTIONS = ['hide_module', 'show_module'];
// Anlegen und Zuordnen — echte Datensätze, umkehrbar.
const WRITE_ACTIONS = ['create_character', 'create_voice', 'assign_voice'];
// Echter Call-Start — braucht Inhalt, Empfänger und bewusste Bestätigung.
const CALL_ACTIONS = ['open_call'];
const ALL_ACTIONS = [...PERSONAL_ACTIONS, ...GLOBAL_ACTIONS, ...WRITE_ACTIONS, ...CALL_ACTIONS, 'answer'];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function plan(action, params = {}, extra = {}) {
  return {
    action,
    params,
    summary: '',
    needsConfirm: false,
    client: false,
    missing: [],
    setupRequired: '',
    candidates: [],
    effects: [],
    ...extra,
  };
}

function missing(list) {
  return { missing: list.filter(Boolean) };
}

// Alles, was zur Entscheidung gebraucht wird: vorhandene Charaktere, Stimmen und Menüpunkte.
async function loadContext(base44) {
  const [creators, voices, layouts] = await Promise.all([
    base44.asServiceRole.entities.Creator.list('-created_date', 200),
    base44.asServiceRole.entities.Voice.list('-created_date', 200),
    base44.asServiceRole.entities.SiteLayout.list('-updated_date', 1),
  ]);
  const layout = layouts[0] || null;
  return {
    creators,
    voices,
    layout,
    creatorList: creators.map((c) => ({ id: c.id, name: c.stageName, age: c.age, voiceProfileId: c.voiceProfileId })),
    voiceList: voices.map((v) => ({ id: v.id, name: v.name, provider: v.provider, externalVoiceId: v.externalVoiceId })),
    nav: (layout?.navItems || []).map((i) => ({ label: i.label, path: i.path, hidden: !!i.hidden })),
  };
}

const norm = (value) => String(value || '').trim().toLowerCase();

// Namen eindeutig auflösen. Mehrere Treffer sind kein Fehler, sondern eine Rückfrage.
function resolveByName(list, wanted, nameKey = 'name') {
  const q = norm(wanted);
  if (!q) return { item: null, matches: [] };
  const matches = list.filter((x) => norm(x[nameKey]).includes(q) || q.includes(norm(x[nameKey])));
  return { item: matches.length === 1 ? matches[0] : null, matches };
}

function findCreator(ctx, name) {
  const q = norm(name);
  if (!q) return { item: null, matches: [] };
  const matches = ctx.creatorList.filter((c) => norm(c.name).includes(q) || q.includes(norm(c.name)));
  return { item: matches.length === 1 ? matches[0] : null, matches };
}

function findNavItem(ctx, name) {
  const q = norm(name);
  if (!q) return { item: null, matches: [] };
  const matches = ctx.nav.filter((n) => norm(n.label).includes(q) || q.includes(norm(n.label)) || norm(n.path).includes(q));
  return { item: matches.length === 1 ? matches[0] : null, matches };
}

// Einen Namen eindeutig auflösen oder gezielt nachfragen — nie Werte erfinden.
function askForName(named, found, kind, options) {
  if (found.item) return '';
  if (!String(named || '').trim()) return `Welchen ${kind} meinst du? Vorhanden sind: ${options.join(', ') || 'noch keine'}.`;
  if (found.matches.length > 1) return `Welchen ${kind} meinst du: ${found.matches.map((m) => m.name || m.label).join(', ')}?`;
  return `Den ${kind} „${named}“ gibt es nicht. Vorhanden sind: ${options.join(', ') || 'noch keine'}.`;
}

// Namen, die im Satz wörtlich vorkommen, gelten als gemeint — so muss die
// Übersetzung keinen Namen erraten. Nur bei genau einem Treffer.
function mentioned(list, text, key) {
  const t = norm(text);
  if (!t) return [];
  return list.filter((x) => t.includes(norm(x[key])));
}

function pickMentioned(list, text, key, current) {
  if (String(current || '').trim()) return current;
  const hits = mentioned(list, text, key);
  return hits.length === 1 ? hits[0][key] : current;
}

function normalizeParams(parameters) {
  if (parameters && typeof parameters === 'object') return parameters;
  if (typeof parameters === 'string') {
    try {
      const parsed = JSON.parse(parameters);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      return {};
    }
  }
  return {};
}

const PANEL_WORDS = [
  { word: 'bot 2', panel: 'bot2' },
  { word: 'bot', panel: 'bot' },
  { word: 'teilen', panel: 'share' },
  { word: 'share', panel: 'share' },
  { word: 'nachrichten', panel: 'chat' },
  { word: 'chat', panel: 'chat' },
];

function panelFromText(text) {
  const t = norm(text);
  const hit = PANEL_WORDS.find((p) => t.includes(p.word));
  return hit?.panel || '';
}

// Übersetzt den Satz in eine Aktion. Die KI darf nur aus der erlaubten Liste wählen.
async function interpret(base44, text, ctx) {
  const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Du übersetzt einen deutschen Befehl der App-Besitzerin in genau eine erlaubte Aktion.
Erfinde niemals Werte. Fehlt etwas Zwingendes, lass das Feld weg und formuliere in "question" eine kurze Rückfrage auf Deutsch.
Schreibe die Parameter immer unter genau den hier genannten Namen (z. B. "moduleName", "voiceName", "panel").

Erlaubte Aktionen und ihre Parameter:
- "create_character": { name, age, personaType (${PERSONA_TYPES.join('|')}), bio, tagline, voiceName } — Charakter anlegen. age ist Pflicht und mindestens 18.
- "create_voice": { name, provider ("GRUNDSTIMME"|"ELEVENLABS"), voiceName, mood (${MOODS.join('|')}), speed (0.7-1.3), depth (-25..25), intensity (0-100), ending (0-100) } — Stimme anlegen.
- "assign_voice": { characterName, voiceName } — vorhandene Stimme einem vorhandenen Charakter dauerhaft zuordnen.
- "open_call": { voiceName } — Videocall öffnen und diese vorhandene Stimme verwenden.
- "open_panel": { panel ("chat"|"bot"|"bot2"|"share") } — Fenster daneben öffnen.
- "hide_panel": { panel } — Fenster ausblenden. "show_panel" ist nicht erlaubt, nutze "open_panel".
- "move_panel": { panel, side ("left"|"right") } — Fenster nach links oder rechts verschieben.
- "set_text_size": { size (11-17) } — Schrift in den Fenstern größer oder kleiner.
- "set_call_voice": { voiceName } — Stimme im laufenden Call umstellen.
- "hide_module": { moduleName } — Menüpunkt für alle ausblenden.
- "show_module": { moduleName } — Menüpunkt für alle wieder einblenden.
- "answer": { answer } — wenn der Befehl keine erlaubte Aktion ist. Antworte dann ehrlich, kurz und auf Deutsch, was möglich ist.

Vorhandene Charaktere: ${ctx.creatorList.map((c) => c.name).join(', ') || '— keine —'}
Vorhandene Stimmen: ${ctx.voiceList.map((v) => v.name).join(', ') || '— keine —'}
Menüpunkte: ${ctx.nav.map((n) => `${n.label}${n.hidden ? ' (ausgeblendet)' : ''}`).join(', ') || '— keine —'}

Beispiele:
"Erstelle einen Charakter namens Luna, 27, verspielt, mit der Stimme Honey" → create_character { name: "Luna", age: 27, personaType: "SOLO_FEMALE", voiceName: "Honey" }
"Erstelle eine Stimme mit ruhiger Tonlage, langsamer und sanft" → create_voice { name: "...", provider: "GRUNDSTIMME", mood: "SANFT", speed: 0.9 }
"Öffne diesen Chat daneben" → open_panel { panel: "chat" }
"Verschiebe dieses Fenster nach rechts" → move_panel { panel: "chat", side: "right" }
"Blende den Menüpunkt Storys aus" → hide_module { moduleName: "Storys" }

Befehl: "${text}"`,
    response_json_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ALL_ACTIONS },
        parameters: { type: 'object' },
        question: { type: 'string' },
      },
      required: ['action'],
    },
  });
  return res || {};
}

// Aus der KI-Antwort wird ein geprüfter Plan. Hier fällt jede erfundene Aktion raus.
async function buildPlan(base44, raw, ctx, text = '') {
  const action = ALL_ACTIONS.includes(raw.action) ? raw.action : 'answer';
  const p = normalizeParams(raw.parameters);

  if (action === 'answer') {
    return plan('answer', {}, { summary: raw.question || p.answer || 'Diesen Befehl kenne ich nicht. Ich kann Charaktere und Stimmen anlegen, Fenster öffnen, verschieben und ausblenden sowie Menüpunkte ein- und ausblenden.' });
  }

  if (action === 'create_character') {
    const name = String(p.name || '').trim();
    const age = Number(p.age);
    const open = [];
    if (!name) open.push('Wie soll der Charakter heißen?');
    if (!Number.isFinite(age)) open.push('Wie alt ist der Charakter? Mindestens 18.');
    else if (age < 18) open.push('Das Alter muss mindestens 18 sein — jünger lege ich keinen Charakter an.');
    const personaType = PERSONA_TYPES.includes(p.personaType) ? p.personaType : 'SOLO_FEMALE';
    const wantedVoice = pickMentioned(ctx.voiceList, text, 'name', p.voiceName);
    const voice = wantedVoice ? resolveByName(ctx.voiceList, wantedVoice) : { item: null, matches: [] };
    if (wantedVoice && !voice.item) {
      open.push(askForName(wantedVoice, voice, 'Stimme', ctx.voiceList.map((v) => v.name)));
    }
    return plan(action, {
      name, age: Number.isFinite(age) ? age : null, personaType,
      bio: String(p.bio || '').trim(), tagline: String(p.tagline || '').trim(),
      voiceId: voice.item?.id || '', voiceName: voice.item?.name || '',
    }, {
      ...missing(open),
      summary: `Charakter „${name || '?'}“, ${Number.isFinite(age) ? `${age} Jahre` : 'Alter fehlt'}${voice.item ? `, mit der Stimme ${voice.item.name}` : ''} anlegen.`,
      effects: ['Ein neuer Charakter in der Charakter-Liste', voice.item ? `Stimme ${voice.item.name} wird dauerhaft zugeordnet` : 'Noch ohne Stimme'],
    });
  }

  if (action === 'create_voice') {
    const name = String(p.name || '').trim();
    const wantsEleven = String(p.provider || '').toUpperCase() === 'ELEVENLABS';
    const key = (secrets.get('ELEVENLABS_API_KEY') || '').trim();
    const open = [];
    if (!name) open.push('Wie soll die Stimme heißen?');
    let externalVoiceId = '';
    if (wantsEleven && !key) {
      return plan(action, {}, {
        ...missing(open),
        setupRequired: 'Für eine ElevenLabs-Stimme fehlt der Schlüssel ELEVENLABS_API_KEY (Einstellungen → Secrets). Ich kann dir bis dahin nur eine Grundstimme anlegen.',
        summary: 'Einrichtung erforderlich',
      });
    }
    if (wantsEleven) {
      const wanted = String(p.voiceName || p.name || pickMentioned(ctx.voiceList, text, 'name', '') || name).trim();
      try {
        const res = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': key } });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.detail?.message || `ElevenLabs (${res.status})`);
        const list = (data.voices || []).map((v) => ({ id: v.voice_id, name: v.name }));
        const hit = resolveByName(list, wanted);
        if (hit.item) externalVoiceId = hit.item.id;
        else {
          open.push(`Im ElevenLabs-Konto heißt keine Stimme „${wanted}“. Sag mir einen dieser Namen: ${list.slice(0, 8).map((v) => v.name).join(', ')}.`);
        }
      } catch (error) {
        return plan(action, {}, { summary: 'ElevenLabs ist gerade nicht erreichbar', setupRequired: `ElevenLabs antwortet nicht: ${error.message}` });
      }
    }
    const mood = MOODS.includes(String(p.mood || '').toUpperCase()) ? String(p.mood).toUpperCase() : 'NEUTRAL';
    const speed = clamp(Number.isFinite(Number(p.speed)) ? Number(p.speed) : 1, 0.7, 1.3);
    const depth = clamp(Number.isFinite(Number(p.depth)) ? Number(p.depth) : 0, -25, 25);
    const intensity = clamp(Number.isFinite(Number(p.intensity)) ? Number(p.intensity) : 50, 0, 100);
    const ending = clamp(Number.isFinite(Number(p.ending)) ? Number(p.ending) : 50, 0, 100);
    return plan(action, {
      name, provider: wantsEleven ? 'ELEVENLABS' : 'GRUNDSTIMME', externalVoiceId,
      baseVoice: BASE_VOICES.includes(p.baseVoice) ? p.baseVoice : 'honey',
      mood, speed, depth, intensity, ending,
    }, {
      ...missing(open),
      summary: `Stimme „${name || '?'}“ anlegen (${wantsEleven ? 'ElevenLabs' : 'Grundstimme'}, ${mood}, Tempo ${speed.toFixed(2)}).`,
      effects: ['Eine neue Stimme in der Stimmbank'],
    });
  }

  if (action === 'assign_voice') {
    const c = findCreator(ctx, pickMentioned(ctx.creatorList, text, 'name', p.characterName));
    const v = resolveByName(ctx.voiceList, pickMentioned(ctx.voiceList, text, 'name', p.voiceName));
    const open = [];
    if (!c.item) open.push(askForName(p.characterName, c, 'Charakter', ctx.creatorList.map((x) => x.name)));
    if (!v.item) open.push(askForName(p.voiceName, v, 'Stimme', ctx.voiceList.map((x) => x.name)));
    return plan(action, { creatorId: c.item?.id || '', characterName: c.item?.name || p.characterName || '', voiceId: v.item?.id || '', voiceName: v.item?.name || '' }, {
      ...missing(open),
      summary: `Stimme ${v.item?.name || '?'} dem Charakter ${c.item?.name || '?'} zuordnen.`,
      effects: ['Der Charakter spricht ab sofort mit dieser Stimme', 'Die Stimme wird beim vorherigen Charakter gelöst'],
    });
  }

  if (action === 'open_call' || action === 'set_call_voice') {
    const wantedVoice = pickMentioned(ctx.voiceList, text, 'name', p.voiceName);
    const v = wantedVoice ? resolveByName(ctx.voiceList, wantedVoice) : { item: null, matches: [] };
    const open = [];
    if (wantedVoice && !v.item) open.push(askForName(wantedVoice, v, 'Stimme', ctx.voiceList.map((x) => x.name)));
    return plan(action, { voiceId: v.item?.id || '', voiceName: v.item?.name || '' }, {
      ...missing(open),
      client: true,
      needsConfirm: action === 'open_call',
      summary: action === 'open_call'
        ? `Videocall öffnen${v.item ? ` mit der Stimme ${v.item.name}` : ' — ohne zugewiesene Stimme'}.`
        : `Im laufenden Call auf die Stimme ${v.item?.name || '?'} umstellen.`,
      effects: action === 'open_call' ? ['Du landest im Videocall deines Chatraums'] : [],
    });
  }

  if (action === 'open_panel' || action === 'hide_panel' || action === 'move_panel') {
    const panel = PANELS.includes(p.panel) ? p.panel : (panelFromText(text) || 'chat');
    const params = { panel };
    if (action === 'move_panel') params.side = p.side === 'left' ? 'left' : 'right';
    const titles = { chat: 'Raum-Chat', bot: 'Bot 1', bot2: 'Bot 2', share: 'Teilen' };
    return plan(action, params, {
      client: true,
      summary: action === 'open_panel' ? `Fenster „${titles[panel]}“ öffnen.`
        : action === 'hide_panel' ? `Fenster „${titles[panel]}“ ausblenden.`
        : `Fenster „${titles[panel]}“ nach ${params.side === 'left' ? 'links' : 'rechts'} verschieben.`,
      effects: ['Nur deine eigene Ansicht — keine Inhalte werden gelöscht'],
    });
  }

  if (action === 'set_text_size') {
    const size = clamp(Number.isFinite(Number(p.size)) ? Number(p.size) : 14, 11, 17);
    return plan(action, { size }, { client: true, summary: `Schrift in den Fenstern auf ${size} einstellen.` });
  }

  if (action === 'hide_module' || action === 'show_module') {
    const found = findNavItem(ctx, pickMentioned(ctx.nav, text, 'label', p.moduleName));
    const open = [];
    if (!found.item) {
      open.push(askForName(p.moduleName, found, 'Menüpunkt', ctx.nav.map((n) => n.label)));
    }
    const hide = action === 'hide_module';
    return plan(action, { label: found.item?.label || '', path: found.item?.path || '', hidden: hide }, {
      ...missing(open),
      needsConfirm: true,
      summary: found.item ? `Menüpunkt „${found.item.label}“ ${hide ? 'für alle ausblenden' : 'für alle wieder einblenden'}.` : 'Menüpunkt ändern',
      effects: [
        'Das gilt für alle Besucher, nicht nur für dich',
        'Inhalte, Chats und Berechtigungen bleiben unverändert — der Punkt ist nur nicht mehr sichtbar',
      ],
    });
  }

  return plan('answer', {}, { summary: raw.question || 'Diesen Befehl kann ich nicht ausführen.' });
}

// Erneut prüfen und erst dann wirklich schreiben.
async function execute(base44, user, incoming) {
  const ctx = await loadContext(base44);
  const raw = { action: incoming?.action, parameters: { ...(incoming?.params || {}), moduleName: incoming?.params?.label || '' } };
  const checked = await buildPlan(base44, raw, ctx);

  if (checked.action !== incoming?.action) {
    return { ok: false, error: 'Dieser Befehl ist nicht erlaubt.' };
  }
  if (checked.missing.length || checked.setupRequired) {
    return { ok: false, plan: checked, error: 'Es fehlen noch Angaben.' };
  }

  if (checked.client) {
    return { ok: true, plan: checked, client: true, message: checked.summary };
  }

  if (checked.action === 'create_character') {
    const created = await base44.asServiceRole.entities.Creator.create({
      stageName: checked.params.name,
      age: checked.params.age,
      personaType: checked.params.personaType,
      bio: checked.params.bio,
      tagline: checked.params.tagline,
      creatorCategory: 'AI_MODEL',
      onlineStatus: 'AI_AVAILABLE',
      active: true,
      voiceProfileId: checked.params.voiceId || '',
    });
    if (checked.params.voiceId) {
      await base44.asServiceRole.entities.Creator.updateMany(
        { voiceProfileId: checked.params.voiceId, id: { $ne: created.id } },
        { $set: { voiceProfileId: '' } },
      );
    }
    return { ok: true, message: `Charakter „${created.stageName}“ ist angelegt${checked.params.voiceName ? ` und spricht mit ${checked.params.voiceName}` : ''}.`, created: { id: created.id, name: created.stageName } };
  }

  if (checked.action === 'create_voice') {
    const created = await base44.asServiceRole.entities.Voice.create({
      name: checked.params.name,
      provider: checked.params.provider,
      externalVoiceId: checked.params.externalVoiceId || '',
      baseVoice: checked.params.baseVoice,
      mood: checked.params.mood,
      speed: checked.params.speed,
      depth: checked.params.depth,
      intensity: checked.params.intensity,
      ending: checked.params.ending,
      source: 'GRUNDSTIMME',
      ownerName: user.full_name || user.email || '',
      active: true,
      public: true,
    });
    return { ok: true, message: `Stimme „${created.name}“ liegt jetzt in der Stimmbank.`, created: { id: created.id, name: created.name } };
  }

  if (checked.action === 'assign_voice') {
    await base44.asServiceRole.entities.Creator.updateMany(
      { voiceProfileId: checked.params.voiceId, id: { $ne: checked.params.creatorId } },
      { $set: { voiceProfileId: '' } },
    );
    await base44.asServiceRole.entities.Creator.update(checked.params.creatorId, { voiceProfileId: checked.params.voiceId });
    return { ok: true, message: `${checked.params.characterName} spricht ab jetzt mit ${checked.params.voiceName}.` };
  }

  if (checked.action === 'hide_module' || checked.action === 'show_module') {
    if (!ctx.layout) return { ok: false, error: 'Es gibt noch keine Menü-Konfiguration, die ich ändern könnte.' };
    const items = (ctx.layout.navItems || []).map((i) => (i.label === checked.params.label ? { ...i, hidden: checked.params.hidden } : i));
    await base44.asServiceRole.entities.SiteLayout.update(ctx.layout.id, { navItems: items });
    return { ok: true, message: `Menüpunkt „${checked.params.label}“ ist ${checked.params.hidden ? 'ausgeblendet' : 'wieder sichtbar'}.` };
  }

  return { ok: false, error: 'Diesen Befehl kann ich nicht ausführen.' };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    // Der Godmode gehört der echten Besitzer-Identität — serverseitig geprüft.
    if (user.role !== 'admin') return Response.json({ error: 'Nur der Besitzer darf Befehle ausführen.' }, { status: 403 });

    const body = await req.json().catch(() => ({}));

    if (body.confirm) {
      const result = await execute(base44, user, body.plan || {});
      return Response.json(result);
    }

    const text = String(body.text || '').trim();
    if (!text) return Response.json({ error: 'Kein Befehl erhalten.' }, { status: 400 });

    const ctx = await loadContext(base44);
    const raw = await interpret(base44, text, ctx);
    const built = await buildPlan(base44, raw, ctx, text);
    return Response.json({ ok: true, plan: built });
  } catch (error) {
    console.log('ownerCommand failed', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}