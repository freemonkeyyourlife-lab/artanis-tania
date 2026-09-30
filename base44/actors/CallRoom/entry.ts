import { Actor } from 'base44:runtime/actors';

// One room = one private video call. The room id (token) is the only admission
// control, so it is minted client-side and shared as an invite link. The link is
// stable — the host keeps the same room id until they deliberately mint a new one.
// Any group size works over the same link — one person, a pair, or a whole circle.
const MAX = 100;

export default class CallRoom extends Actor {
  users = new Map(); // conn.id -> { seat, name, cam, mic, host }
  nextSeat = 1;
  // OPEN = everyone with the link joins. WATCH = new arrivals only watch silently.
  // PRIVATE = the room is closed, nobody new gets in.
  mode = 'OPEN';

  async handleStart() {
    const saved = await this.storage.get('users');
    if (saved) this.users = new Map(saved);
    const mode = await this.storage.get('mode');
    if (mode === 'OPEN' || mode === 'WATCH' || mode === 'PRIVATE') this.mode = mode;
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
      // A closed room takes nobody new — only the host keeps a way back in.
      if (this.mode === 'PRIVATE' && !host) {
        this.users.set(conn.id, { seat: this.nextSeat++, name: '', cam: false, mic: false, host: false, watcher: false, blocked: true });
        await this.save();
        conn.send({ type: 'closed' });
        return;
      }
      // cam/mic stay null until the client reports its real state, so nobody
      // gets a wrong "camera off" pushed onto them right after joining.
      const watcher = this.mode === 'WATCH' && !host;
      this.users.set(conn.id, {
        seat: this.nextSeat++, name: '', host, watcher, blocked: false,
        cam: watcher ? false : null,
        mic: watcher ? false : null,
      });
      await this.save();
    }
    const me = this.users.get(conn.id);
    if (me.blocked) { conn.send({ type: 'closed' }); return; }
    conn.send({ type: 'you', seat: me.seat, host: me.host, watcher: !!me.watcher });
    conn.send({ type: 'mode', mode: this.mode });
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

  connForSeat(seat) {
    for (const c of this.getConnections()) {
      const u = this.users.get(c.id);
      if (u && u.seat === seat) return c;
    }
    return null;
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