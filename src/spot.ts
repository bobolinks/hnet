import { version } from '../package.json';
import { HNET_BROADCAST_PORT, HNET_DATA_PORT } from './const';
import { EventEmitter } from './events';
import { HnetMessage, randomHex } from './message';
import codec from './codec';
import type { HnetAddress, HnetChannel, HnetChnnID, HnetCommandMap, HnetEventMap, HnetHost, HnetPointType, HnetResponse, Logger, Options, PUID, RemoteAddressInfo, UDPSocket } from '../types';

function genUUID() {
  return `${randomHex(8)}-${randomHex(4)}-${randomHex(4)}-${randomHex(4)}-${randomHex(12)}`;
}

export class HnetSpot extends EventEmitter<HnetEventMap> {
  public readonly options: Required<Options> = {
    uuid: genUUID(),
    type: 'host',
    port: HNET_DATA_PORT,
    name: `hnetspot/${version}`,
  };
  public readonly hosts: Record<PUID, HnetHost> = {};

  protected started = false;
  protected adTimer: any;

  /** broadcast port, default 1901 */
  protected readonly sigport: number;

  protected readonly channels: HnetChannel[] = [];

  constructor(public readonly sigso: UDPSocket, public readonly datso: UDPSocket, opts?: Partial<Options>, sigport?: number, protected readonly logger?: Logger) {
    super();
    if (opts) {
      Object.assign(this.options, opts);
    }
    this.sigport = sigport || HNET_BROADCAST_PORT;
    this.sigso.once('listening', () => {
      this.sigso.setBroadcast(true);
    });
    this.sigso.bind(this.sigport);
    this.datso.bind(this.options.port);
  }

  start() {
    if (this.started) {
      return false;
    }
    this.started = true;
    this.sigso.on('message', ({ data, rinfo }) => {
      this.parseMessage(data as any, rinfo);
    });
    this.datso.on('message', ({ data, rinfo }) => {
      const msg: HnetMessage<'data'> = codec.decode(data as any) as any;
      msg.fields.from.host = rinfo.address;
      // is response of searching?
      if (msg.isr) {
        this.parseResponse(msg as any, rinfo);
      } else {
        this.emit('data', msg.fields);
      }
    });
    this.adTimer = setInterval(() => {
      this.advertise(true);
    }, 3000);
    if (this.logger) {
      this.logger.info(`Spot[${this.options.name}] started with ports[${this.options.port},${this.sigport}]`);
    }
    return true;
  }

  stop() {
    if (!this.started) {
      return;
    }
    if (this.adTimer) {
      clearInterval(this.adTimer);
      this.adTimer = null;
    }
    this.advertise(false);
    this.sigso.clearEventListeners();
    this.datso.clearEventListeners();
    if (this.logger) {
      this.logger.info(`Spot[${this.options.name}] stoped`);
    }
  }

  addChannel(channel: HnetChannel): boolean {
    if (this.channels.find(e => e.id === channel.id)) {
      if (this.logger) {
        this.logger.warn(`Channel[${channel.id}] exists!`);
      }
      return false;
    }
    this.channels.push(channel);

    this.advertise(true);

    return true;
  }

  removeChannel(id: HnetChnnID): void {
    const index = this.channels.findIndex(e => e.id === id);
    if (index !== -1) {
      this.channels.splice(index, 1);
      this.advertise(true);
    }
  }

  send(message: HnetMessage<any, any>, target: Pick<HnetAddress, 'host' | 'port'>) {
    const buf = message.toBuffer();

    this.datso.send(buf, 0, buf.length, { address: target.host, port: target.port });
  }

  sendData(data: string | Uint8Array, target: Pick<HnetAddress, 'host' | 'port'>, chnn: number) {
    const req: HnetCommandMap['data']['req'] = {
      from: { host: '', ...this.options, },
      data,
      chnn,
    };
    const msg = new HnetMessage('data', req);
    return this.send(msg, target);
  }

  /** search points with type */
  search(type?: HnetPointType | '*'): void {
    const from: HnetCommandMap['search']['req'] = {
      from: { host: '', ...this.options, },
      type: type || '*',
    };
    const msg = new HnetMessage('search', from);

    this.broadcast(msg);
  }

  private advertise(alive?: boolean) {
    const req: HnetCommandMap['alive']['req'] | HnetCommandMap['bye']['req'] = {
      from: { host: '', ...this.options }
    };
    if (alive) {
      const channels = this.channels.map(e => ({ id: e.id, name: e.name }));

      (req as any as HnetCommandMap['alive']['req']).channels = channels;
    }
    const msg = new HnetMessage<'alive' | 'bye'>(alive ? 'alive' : 'bye', req);

    this.broadcast(msg);
  }

  /**
   * Routes a network message to the appropriate handler.
   *
   * @param msg
   * @param rinfo
   */
  private parseMessage(buffer: ArrayBuffer, rinfo: RemoteAddressInfo) {
    const msg: HnetMessage<'alive' | 'bye' | 'search'> = codec.decode(new Uint8Array(buffer)) as any;

    // is from me ?
    if (msg.fields.from.uuid === this.options.uuid) {
      return;
    }

    msg.fields.from.host = rinfo.address;

    if (msg.isr) {
      this.parseResponse(msg as any, rinfo);
    } else {
      this.parseCommand(msg, rinfo);
    }
  }

  /**
   * Parses SSDP command.
   *
   * @param msg
   * @param rinfo
   */
  private parseCommand(msg: HnetMessage<'alive' | 'bye' | 'search'>, rinfo: RemoteAddressInfo) {
    switch (msg.type) {
      case 'alive': {
        if (msg.fields.from.type !== 'host') {
          return;
        }
        const host: HnetHost = { ...msg.fields.from, host: rinfo.address, active: Date.now() };
        this.hosts[host.uuid] = host;
        this.emit('alive', msg.fields);
        if (this.logger) {
          this.logger.info(`Alive message from ${host.host}:${host.port} [${host.name}]`);
        }
      } break;
      case 'bye': {
        if (msg.fields.from.type !== 'host') {
          return;
        }
        delete this.hosts[msg.fields.from.uuid];
        this.emit('bye', msg.fields);
        if (this.logger) {
          this.logger.info(`Bye message from ${msg.fields.from.host}:${msg.fields.from.port} [${msg.fields.from.name}]`);
        }
      } break;
      case 'search':
        this.handleSearch(msg as any, rinfo);
        break;
      default:
        if (this.logger) {
          this.logger.warn(`Unhandled command from ${rinfo.address}:${rinfo.port}`);
        }
    }
  }

  /**
   * Handles SEARCH command.
   *
   * @param headers
   * @param msg
   * @param rinfo
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private handleSearch(msg: HnetMessage<'search'>, rinfo: RemoteAddressInfo) {
    if (msg.fields.type !== '*' && msg.fields.type !== this.options.type) {
      return;
    }
    if (this.logger) {
      this.logger.info(`Search message from ${msg.fields.from.host}:${msg.fields.from.port} [${msg.fields.from.name}]`);
    }
    const from: HnetResponse = {
      from: { host: '', ...this.options },
      code: 0,
    };
    const rsp = new HnetMessage<'search', 'rsp'>('search', from, true);

    this.send(rsp, msg.fields.from);
  }

  /**
   * Parses SSDP response message.
   *
   * @param msg
   * @param rinfo
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private parseResponse(msg: HnetMessage<'search', 'rsp'>, rinfo: RemoteAddressInfo) {
    if (this.logger) {
      this.logger.info(`Response from ${msg.fields.from.host}:${msg.fields.from.port} [${msg.fields.from.name}]`);
    }

    if (msg.type === 'search') {
      this.emit('found', msg.fields.from);
    }
  }

  private broadcast(message: HnetMessage<any, any>) {
    const buf = message.toBuffer();

    this.sigso.send(buf, 0, buf.length, { address: '255.255.255.255', port: this.sigport });
  }
}

