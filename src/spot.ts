import { version } from '../package.json';
import { HNET_BROADCAST_PORT, HNET_DATA_PORT } from './const';
import { EventEmitter } from './events';
import { HnetMessage, randomHex } from './message';
import codec from './codec';
import type { HnetAddress, HnetCommandMap, HnetEventMap, HnetFrom, HnetPointType, HnetResponse, Logger, Options, PUID, RemoteAddressInfo, UDPSocket } from '../types';

function genUUID() {
  return `${randomHex(8)}-${randomHex(4)}-${randomHex(4)}-${randomHex(4)}-${randomHex(12)}`;
}

type HnetHost = HnetAddress & {
  active: number;
};

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

  send(message: HnetMessage<any, any>, target: Pick<HnetAddress, 'host' | 'port'>) {
    const buf = message.toBuffer();

    this.datso.send(buf, 0, buf.length, { address: target.host, port: target.port });
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
    const from: HnetFrom = {
      from: { host: '', ...this.options }
    };
    const msg = new HnetMessage<'alive' | 'bye'>(alive ? 'alive' : 'bye', from);

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
        const host: HnetHost = { ...msg.fields.from, host: rinfo.address, active: Date.now() };
        this.hosts[host.uuid] = host;
        this.emit('alive', msg.fields);
        if (this.logger) {
          this.logger.info(`Alive message from ${host.host}:${host.port} [${host.name}]`);
        }
      } break;
      case 'bye': {
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

