
import { EventEmitter } from '../events';

export class UDPSocket extends EventEmitter<UDPSocketEventMap> {
  public readonly native = wx.createUDPSocket();

  protected isBroadcast = false;

  constructor() {
    super();
    this.native.onMessage((result: WechatMiniprogram.UDPSocketOnMessageListenerResult) => {
      this.emit('message', { data: result.message, rinfo: result.remoteInfo });
    });
  }

  setTTL(value: number): void {
    this.native.setTTL(value);
  }
  setBroadcast(flag: boolean): void {
    this.isBroadcast = flag;
  }

  bind(port: number): number {
    const r = this.native.bind(port);
    this.emit('listening', {});
    return r;
  }

  connect(address: string, port: number): void {
    this.native.connect({ address, port });
  }

  send(msg: string | Uint8Array, offset: number, length: number, address: Address): void {
    this.native.send({
      message: msg,
      offset,
      length,
      port: address.port,
      address: address.address,
      setBroadcast: this.isBroadcast ?? undefined,
    });
  }
  close(): void {
    this.native.close();
  }
}