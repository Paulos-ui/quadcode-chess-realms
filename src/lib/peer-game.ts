/**
 * PeerJS connection manager.
 * - Host calls openHost() — gets a short code, waits for friend to join.
 * - Joiner calls openJoin(code) — connects to the host.
 * - Both sides exchange typed NetMessage payloads over a single data channel.
 *
 * No backend required — uses PeerJS's free cloud broker at peerjs.com.
 * The "code" we expose is just a short, easy-to-share suffix of the peer ID.
 */
import { Peer, type DataConnection } from 'peerjs';

export type NetMessage =
  | { type: 'hello'; from: string }
  | { type: 'gameStart'; hostColor: 'w' | 'b' }
  | { type: 'move'; from: string; to: string; promotion?: string }
  | { type: 'resign' }
  | { type: 'drawOffer' }
  | { type: 'drawAccept' }
  | { type: 'drawDecline' }
  | { type: 'rematch' };

export type PeerStatus =
  | 'idle'
  | 'opening'
  | 'waiting'        // host: code is live, waiting for join
  | 'connecting'     // joiner: dialing host
  | 'connected'
  | 'disconnected'
  | 'error';

interface Handlers {
  onStatus?: (s: PeerStatus, detail?: string) => void;
  onMessage?: (msg: NetMessage) => void;
}

const ID_PREFIX = 'jkcr-'; // namespace so we don't collide with other PeerJS demos

function randomCode(len = 6): string {
  // Avoid ambiguous chars (0/O, 1/I/L)
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export class PeerSession {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private handlers: Handlers = {};
  private status: PeerStatus = 'idle';
  /** Short share-code shown to user, also used as PeerJS ID suffix. */
  public code = '';

  setHandlers(h: Handlers) {
    this.handlers = h;
  }

  private setStatus(s: PeerStatus, detail?: string) {
    this.status = s;
    this.handlers.onStatus?.(s, detail);
  }

  getStatus() {
    return this.status;
  }

  /** Start as host. Resolves with the share-code. */
  openHost(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.setStatus('opening');
      this.code = randomCode();
      const id = ID_PREFIX + this.code;
      const peer = new Peer(id, { debug: 0 });
      this.peer = peer;

      const timeout = setTimeout(() => {
        // If we never connect to the broker, fail clearly
        if (this.status === 'opening') {
          this.setStatus('error', 'Could not reach matchmaking server');
          reject(new Error('peer broker timeout'));
        }
      }, 8000);

      peer.on('open', () => {
        clearTimeout(timeout);
        this.setStatus('waiting');
        resolve(this.code);
      });

      peer.on('connection', (incoming) => {
        this.attach(incoming);
      });

      peer.on('error', (err) => {
        clearTimeout(timeout);
        const msg = err.message ?? String(err);
        // "ID-taken" means someone else already grabbed this code — retry with a new one
        if (msg.includes('is taken')) {
          peer.destroy();
          this.peer = null;
          this.openHost().then(resolve).catch(reject);
          return;
        }
        this.setStatus('error', msg);
        reject(err);
      });

      peer.on('disconnected', () => {
        this.setStatus('disconnected', 'Broker disconnected');
      });
    });
  }

  /** Join an existing host by code. Resolves when the data channel opens. */
  openJoin(code: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.setStatus('opening');
      this.code = code.toUpperCase();
      const peer = new Peer(undefined as unknown as string, { debug: 0 });
      this.peer = peer;

      const timeout = setTimeout(() => {
        if (this.status !== 'connected') {
          this.setStatus('error', 'Connection timed out — wrong code?');
          reject(new Error('join timeout'));
        }
      }, 10000);

      peer.on('open', () => {
        this.setStatus('connecting');
        const conn = peer.connect(ID_PREFIX + this.code, { reliable: true });
        this.attach(conn, () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      peer.on('error', (err) => {
        clearTimeout(timeout);
        const msg = err.message ?? String(err);
        if (msg.includes('Could not connect to peer')) {
          this.setStatus('error', 'No one home at that code');
        } else {
          this.setStatus('error', msg);
        }
        reject(err);
      });
    });
  }

  private attach(conn: DataConnection, onOpen?: () => void) {
    this.conn = conn;
    conn.on('open', () => {
      this.setStatus('connected');
      onOpen?.();
    });
    conn.on('data', (raw) => {
      try {
        const msg = (typeof raw === 'string' ? JSON.parse(raw) : raw) as NetMessage;
        this.handlers.onMessage?.(msg);
      } catch {
        // ignore malformed
      }
    });
    conn.on('close', () => {
      this.setStatus('disconnected', 'Opponent disconnected');
    });
    conn.on('error', (err) => {
      this.setStatus('error', err?.message ?? 'Connection error');
    });
  }

  send(msg: NetMessage) {
    if (!this.conn) return;
    try {
      this.conn.send(JSON.stringify(msg));
    } catch (e) {
      console.warn('PeerSession.send failed', e);
    }
  }

  destroy() {
    try {
      this.conn?.close();
    } catch {
      /* noop */
    }
    try {
      this.peer?.destroy();
    } catch {
      /* noop */
    }
    this.conn = null;
    this.peer = null;
    this.setStatus('idle');
  }
}
