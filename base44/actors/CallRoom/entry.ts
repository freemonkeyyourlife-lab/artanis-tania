import { Actor } from 'base44:runtime/actors';

// One room = one private video call. The room id (token) is the only admission
// control, so it is minted client-side and shared as an invite link. The link is
// stable — the host keeps the same room id until they deliberately mint a new one.
// Any group size works over the same link — one person, a pair, or a whole circle.
const MAX = 10;

export default class CallRoom extends Actor {
  users = new Map(); // conn.id -> { seat, name, cam, mic, host }
  nextSeat = 1;
  allowCam = true; // host setting, applies to everyone but the host
  allowMic = true;

  async handleStart() {
    const saved = await this.storage.get('users');
    if (saved) this.users = new Map(saved);
    const flags = await this.storage.get('flags');
    if (flags) {
      this.allowCam = flags.allowCam !== false;
      this.allowMic = flags.allowMic !== false;
    }
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
      // cam/mic stay null until the client reports its real state, so nobody
      // gets a wrong "camera off" pushed onto them right after joining.
      const user = { seat: this.nextSeat++, name: '', cam: null, mic: null, host: false };
      this.users.set(conn.id, user);
      user.host = await this.isHost(conn);
      await this.save();
    }
    const me = this.users.get(conn.id);
    conn.send({ type: 'you', seat: me.seat, host: me.host });
    conn.send({ type: 'flags', allowCam: this.allowCam, allowMic: this.allowMic });
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
    if (msg.type === 'chat') {
      const text = String(msg.text ?? '').trim().slice(0, 2000);
      if (!text) return;
      this.broadcast({ type: 'chat', seat: me.seat, name: me.name || 'Gast', text });
      return;
    }

    if (msg.type === 'media') {
      const cam = msg.cam === true;
      const mic = msg.mic === true;
      if (!me.host) {
        if (cam && !this.allowCam) { conn.send({ type: 'denied', what: 'cam' }); return; }
        if (mic && !this.allowMic) { conn.send({ type: 'denied', what: 'mic' }); return; }
      }
      me.cam = cam;
      me.mic = mic;
      await this.save();
      this.broadcastPeers();
      return;
    }

    if (msg.type === 'flags') {
      if (!me.host) return;
      if (typeof msg.allowCam === 'boolean') this.allowCam = msg.allowCam;
      if (typeof msg.allowMic === 'boolean') this.allowMic = msg.allowMic;
      await this.storage.put('flags', { allowCam: this.allowCam, allowMic: this.allowMic });
      for (const u of this.users.values()) {
        if (u.host) continue;
        if (!this.allowCam) u.cam = false;
        if (!this.allowMic) u.mic = false;
      }
      await this.save();
      this.broadcast({ type: 'flags', allowCam: this.allowCam, allowMic: this.allowMic });
      this.broadcastPeers();
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
      peers: [...this.users.values()].map((u) => ({ seat: u.seat, name: u.name, cam: u.cam, mic: u.mic, host: u.host })),
    });
  }
}