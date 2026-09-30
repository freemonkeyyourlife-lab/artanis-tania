import { Actor } from 'base44:runtime/actors';

// One room = one private video call. The room id (token) is minted client-side and
// shared as an invite link. The host keeps the same room id until they deliberately
// mint a new one. Any group size works over the same link — one person, a pair, or a
// whole circle. A closed room opens only for a guest who brings the personal link the
// host made for them: those links live here, and only the host can take them back.
const MAX = 100;

// Ohne 0/O und 1/I — sonst verliest man sich beim Abtippen.
const INVITE_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';

function newInviteToken() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => INVITE_ALPHABET[b % INVITE_ALPHABET.length]).join('');
}

export default class CallRoom extends Actor {
  users = new Map(); // conn.id -> { seat, name, cam, mic, host }
  nextSeat = 1;
  // token -> { token, name, usedBy, usedAt, created } — die persönlichen Gäste-Links.
  invites = new Map();
  // OPEN = everyone with the link joins. WATCH = new arrivals only watch silently.
  // PRIVATE = the room is closed, nobody new gets in.
  mode = 'OPEN';
  // Die Bühne: welche Unterhaltung der Plattform gerade im Call läuft. Alle im
  // Raum sehen genau diesen Chat — der Gastgeber legt ihn auf.
  stage = null; // { id, title }
  stageLines = []; // die letzten Zeilen, damit Spätkommende mitlesen können

  async handleStart() {
    const saved = await this.storage.get('users');
    if (saved) this.users = new Map(saved);
    const invites = await this.storage.get('invites');
    if (invites) this.invites = new Map(invites);
    const mode = await this.storage.get('mode');
    if (mode === 'OPEN' || mode === 'WATCH' || mode === 'PRIVATE') this.mode = mode;
    const stage = await this.storage.get('stage');
    if (stage && typeof stage.id === 'string') this.stage = { id: stage.id, title: String(stage.title ?? '').slice(0, 80) };
    const lines = await this.storage.get('stageLines');
    if (Array.isArray(lines)) this.stageLines = lines;
    const live = new Set(this.getConnections().map((c) => c.id));
    for (const id of this.users.keys()) if (!live.has(id)) this.users.delete(id);
    this.nextSeat = Math.max(0, ...[...this.users.values()].map((u) => u.seat)) + 1;
  }

  async handleConnect(conn) {
    if (!this.users.has(conn.id) && this.users.size >= MAX) {
      conn.reject(4001, 'room full');
      return;
    }
    // Reconnects are routine — a returning id reclaims its seat, name and role.
    if (!this.users.has(conn.id)) {
      const host = await this.isHost(conn);
      // cam/mic stay null until the client reports its real state, so nobody
      // gets a wrong "camera off" pushed onto them right after joining.
      const watcher = this.mode === 'WATCH' && !host;
      // A closed room takes nobody new — unless a guest link opens the door.
      // Ob der Link gültig ist, zeigt sich beim ersten Lebenszeichen.
      const waiting = this.mode === 'PRIVATE' && !host;
      this.users.set(conn.id, {
        seat: this.nextSeat++, name: '', host, watcher, blocked: waiting,
        cam: watcher ? false : null,
        mic: watcher ? false : null,
      });
      await this.save();
    }
    const me = this.users.get(conn.id);
    // Noch nicht hereingelassen — das entscheidet der Gäste-Link beim hello.
    if (me.blocked) return;
    conn.send({ type: 'you', seat: me.seat, host: me.host, watcher: !!me.watcher });
    conn.send({ type: 'mode', mode: this.mode });
    if (me.host) this.sendInvites();
    // Wer später dazukommt, steigt mitten in den laufenden Chat ein.
    if (this.stage) {
      conn.send({ type: 'stage', stage: this.stage });
      conn.send({ type: 'stage_lines', lines: this.stageLines });
    }
    this.broadcastPeers();
  }

  // The host is the app owner — verified from the platform identity, never from a client claim.
  async isHost(conn) {
    const identity = conn.identity;
    if (!identity || identity.type !== 'authenticated' || !identity.userId) return false;
    try {
      const user = await this.client.asServiceRole.entities.User.get(identity.userId);
      return user?.role === 'admin';
    } catch (e) {
      console.error('host check failed', e);
      return false;
    }
  }

  async handleMessage(conn, msg) {
    if (typeof msg !== 'object' || msg === null) return;
    const me = this.users.get(conn.id);
    if (!me) return;

    if (msg.type === 'hello') {
      me.name = String(msg.name ?? '').slice(0, 40);
      // Der persönliche Gäste-Link ist die Eintrittskarte: er öffnet auch einen
      // geschlossenen Raum und wird beim Gastgeber als benutzt vermerkt.
      const invite = this.findInvite(msg.guest);
      if (invite) {
        invite.usedBy = me.name || 'Gast';
        invite.usedAt = new Date().toISOString();
        await this.storage.put('invites', [...this.invites.entries()]);
        this.sendInvites();
      }
      if (me.blocked) {
        if (!invite) { conn.send({ type: 'closed' }); return; }
        me.blocked = false;
        conn.send({ type: 'you', seat: me.seat, host: me.host, watcher: !!me.watcher });
        conn.send({ type: 'mode', mode: this.mode });
      }
      await this.save();
      this.broadcastPeers();
      return;
    }

    if (msg.type === 'signal') {
      // Targeted relay — with more than two people every message needs an addressee.
      const target = this.connForSeat(msg.to);
      if (target) target.send({ type: 'signal', from: me.seat, data: msg.data });
      return;
    }

    // Text chat runs alongside the video — everyone in the room sees it, live.
    // Sprachnachrichten gehen denselben Weg: durch den Raum wandert nur die
    // fertige Ablage-Adresse, nie die Aufnahme selbst.
    if (msg.type === 'chat') {
      const text = String(msg.text ?? '').trim().slice(0, 2000);
      const audio = typeof msg.audio === 'string' && /^https?:\/\//.test(msg.audio) ? msg.audio.slice(0, 500) : '';
      if (!text && !audio) return;
      this.broadcast({ type: 'chat', seat: me.seat, name: me.name || 'Gast', text, audio });
      return;
    }

    if (msg.type === 'media') {
      // Zuschauer bleiben stumm und unsichtbar — sie schauen nur zu.
      if (me.watcher) {
        me.cam = false;
        me.mic = false;
        await this.save();
        this.broadcastPeers();
        return;
      }
      const cam = msg.cam === true;
      const mic = msg.mic === true;
      me.cam = cam;
      me.mic = mic;
      await this.save();
      this.broadcastPeers();
      return;
    }

    // Der Gastgeber legt fest, welcher Plattform-Chat im Call läuft.
    if (msg.type === 'stage_open') {
      if (!me.host) return;
      const id = String(msg.id ?? '').slice(0, 64);
      if (!id) return;
      this.stage = { id, title: String(msg.title ?? '').slice(0, 80) };
      this.stageLines = [];
      await this.storage.put('stage', this.stage);
      await this.storage.put('stageLines', []);
      this.broadcast({ type: 'stage', stage: this.stage });
      return;
    }

    if (msg.type === 'stage_close') {
      if (!me.host) return;
      this.stage = null;
      this.stageLines = [];
      await this.storage.put('stage', null);
      await this.storage.put('stageLines', []);
      this.broadcast({ type: 'stage', stage: null });
      return;
    }

    // Die Brücke (der Gastgeber) schickt die echten Zeilen der Unterhaltung herein.
    if (msg.type === 'stage_seed' || msg.type === 'stage_line') {
      if (!me.host || !this.stage) return;
      const fresh = (msg.type === 'stage_seed' && Array.isArray(msg.lines) ? msg.lines : [msg.line])
        .map((l) => this.cleanLine(l))
        .filter(Boolean);
      if (!fresh.length) return;
      this.stageLines = msg.type === 'stage_seed'
        ? fresh.slice(-120)
        : [...this.stageLines, ...fresh].slice(-120);
      await this.storage.put('stageLines', this.stageLines);
      if (msg.type === 'stage_seed') {
        this.broadcast({ type: 'stage_lines', lines: this.stageLines });
      } else {
        this.broadcast({ type: 'stage_line', line: fresh[fresh.length - 1] });
      }
      return;
    }

    // Jeder im Call darf in den laufenden Chat schreiben — der Gastgeber trägt es
    // dann in die echte Unterhaltung ein.
    if (msg.type === 'stage_say') {
      if (!this.stage || me.watcher) return;
      const text = String(msg.text ?? '').trim().slice(0, 2000);
      if (!text) return;
      const line = { id: `r${me.seat}-${Date.now()}`, sender: me.name || 'Gast', senderType: 'HUMAN', text, seat: me.seat };
      this.stageLines = [...this.stageLines, line].slice(-120);
      await this.storage.put('stageLines', this.stageLines);
      this.broadcast({ type: 'stage_line', line });
      return;
    }

    // Nur der Gastgeber verteilt Einladungen — und nur er nimmt sie zurück.
    if (msg.type === 'invite_create') {
      if (!me.host) return;
      const name = String(msg.name ?? '').trim().slice(0, 40);
      // Den Code darf der Gastgeber mitgeben — so kennt die App den Link schon,
      // bevor sie ihn verschickt. Sonst macht der Raum selbst einen.
      const asked = String(msg.token ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const token = asked.length >= 8 && asked.length <= 32 && !this.invites.has(asked)
        ? asked
        : newInviteToken();
      this.invites.set(token, { token, name: name || 'Gast', active: true, usedBy: '', usedAt: '', created: new Date().toISOString() });
      await this.storage.put('invites', [...this.invites.entries()]);
      this.sendInvites();
      return;
    }

    if (msg.type === 'invite_revoke') {
      if (!me.host) return;
      const token = String(msg.token ?? '');
      if (!this.invites.has(token)) return;
      this.invites.delete(token);
      await this.storage.put('invites', [...this.invites.entries()]);
      this.sendInvites();
      return;
    }

    // Der Gastgeber bestimmt, wer überhaupt herein darf.
    if (msg.type === 'mode') {
      if (!me.host) return;
      const next = msg.mode;
      if (next !== 'OPEN' && next !== 'WATCH' && next !== 'PRIVATE') return;
      this.mode = next;
      // Zurück auf offen: wer bisher nur zugeschaut hat, darf wieder mitmachen.
      if (next === 'OPEN') {
        for (const u of this.users.values()) {
          if (u.watcher) { u.watcher = false; u.cam = false; u.mic = false; }
        }
        await this.save();
        this.broadcastPeers();
      }
      await this.storage.put('mode', next);
      this.broadcast({ type: 'mode', mode: next });
    }
  }

  async handleClose(conn) {
    this.users.delete(conn.id);
    await this.save();
    this.broadcastPeers();
  }

  // Eine Zeile der Bühne — nur die öffentliche Form verlässt den Raum.
  cleanLine(line) {
    if (!line || typeof line !== 'object') return null;
    const text = String(line.text ?? '').slice(0, 4000);
    if (!text) return null;
    const kind = line.senderType === 'AI' ? 'AI' : line.senderType === 'SYSTEM' ? 'SYSTEM' : 'HUMAN';
    return {
      id: String(line.id ?? '').slice(0, 64) || `l${Date.now()}`,
      sender: String(line.sender ?? '').slice(0, 40),
      senderType: kind,
      text,
    };
  }

  connForSeat(seat) {
    for (const c of this.getConnections()) {
      const u = this.users.get(c.id);
      if (u && u.seat === seat) return c;
    }
    return null;
  }

  // Ein Link gilt, bis der Gastgeber ihn sperrt.
  findInvite(token) {
    const key = String(token ?? '').trim();
    if (!key) return null;
    const invite = this.invites.get(key);
    return invite && invite.active ? invite : null;
  }

  // Die Einladungen gehören nur dem Gastgeber — niemand sonst sieht sie.
  sendInvites() {
    const invites = [...this.invites.values()].map((i) => ({
      token: i.token, name: i.name, usedBy: i.usedBy || '', usedAt: i.usedAt || '',
    }));
    for (const c of this.getConnections()) {
      if (this.users.get(c.id)?.host) c.send({ type: 'invites', invites });
    }
  }

  save() {
    return this.storage.put('users', [...this.users.entries()]);
  }

  // Only the public shape ever leaves the room — never conn.id.
  broadcastPeers() {
    this.broadcast({
      type: 'peers',
      peers: [...this.users.values()]
        .filter((u) => !u.blocked)
        .map((u) => ({ seat: u.seat, name: u.name, cam: u.cam, mic: u.mic, host: u.host, watcher: !!u.watcher })),
    });
  }
}