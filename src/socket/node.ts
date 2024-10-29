
import dgram, { RemoteInfo } from 'dgram';
import { EventEmitter } from '../events';

export class UDPSocket extends EventEmitter<UDPSocketEventMap> {
  public readonly native = dgram.createSocket({ type: 'udp4', reuseAddr: true });

  protected isBroadcast = false;

  constructor() {
    super();
    this.native.on('message', (msg: Buffer, rinfo: RemoteInfo) => {
      this.emit('message', { data: msg, rinfo });
    });
  }

  setTTL(value: number): void {
    this.native.setTTL(value);
  }
  setBroadcast(flag: boolean): void {
    this.isBroadcast = flag;
    this.native.setBroadcast(flag);
  }

  bind(port: number): number {
    this.native.bind(port, () => {
      return this.emit('listening', {});
    });
    return 0;
  }

  connect(address: string, port: number): void {
    this.native.connect(port, address);
  }

  send(msg: string | Uint8Array, offset: number, length: number, address: Address): void {
    this.native.send(msg,
      offset,
      length,
      address.port,
      address.address);
  }
  close(): void {
    this.native.close();
    this.native.unref();
  }
}