import { Actor } from 'base44:runtime/actors';

const MAX = 2;

// One room = one private 1:1 video call. The room id (token) is the only admission control,
// so it is minted client-side with crypto.randomUUID() and shared as an invite link.
export default class CallRoom extends Actor {
  users = new Map(); // conn.id -> { seat, name }
  nextSeat = 1;

  async handleStart() {
    const saved = await this.storage.get('users');
    if (saved) this.users = new Map(saved);
    const live = new Set(this.getConnections().map((c) => c.id));
    for (const id of this.users.keys()) if (!live.has(id)) this.users.delete(id);
    this.nextSeat = Math.max(0, ...[...this.users.values()].map((u) => u.seat)) + 1;
  }

  async handleConnect(conn) {
    if (!this.users.has(conn.id) && this.users.size >= MAX) {
      conn.reject(4001, 'room full');
      return;
    }
    if (!this.users.has(conn.id)) {
      this.users.set(conn.id, { seat: this.nextSeat++, name: '' });
      await this.save();
    }
    conn.send({ type: 'you', seat: this.users.get(conn.id).seat });
    this.broadcastPeers();
  }

  async handleMessage(conn, msg) {
    if (typeof msg !== 'object' || msg === null) return;
    const u = this.users.get(conn.id);
    if (!u) return;
    if (msg.type === 'hello') {
      u.name = String(msg.name ?? '').slice(0, 40);
      await this.save();
      this.broadcastPeers();
    } else if (msg.type === 'signal') {
      // Relay WebRTC offer/answer/ICE to the other peer only.
      for (const c of this.getConnections()) {
        if (c.id !== conn.id) c.send({ type: 'signal', from: u.seat, data: msg.data });
      }
    }
  }

  async handleClose(conn) {
    this.users.delete(conn.id);
    await this.save();
    this.broadcastPeers();
  }

  save() {
    return this.storage.put('users', [...this.users.entries()]);
  }

  broadcastPeers() {
    this.broadcast({
      type: 'peers',
      peers: [...this.users.values()].map((u) => ({ seat: u.seat, name: u.name })),
    });
  }
}