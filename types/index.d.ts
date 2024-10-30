declare type FnEvtListener<TEventData> = (event: TEventData) => void;

/* From threejs EventDispatcher */
export declare class EventEmitter<TEventMap extends {} = {}> {
  /**
   * Adds a listener to an event type.
   * @param type The type of event to listen to.
   * @param listener The function that gets called when the event is fired.
   */
  addEventListener<T extends Extract<keyof TEventMap, string>>(type: T, listener: FnEvtListener<TEventMap[T]>): void;
  on<T extends Extract<keyof TEventMap, string>>(type: T, listener: (event: TEventMap[T]) => void): void;
  once<T extends Extract<keyof TEventMap, string>>(type: T, listener: (event: TEventMap[T]) => void): void;

  /**
   * Checks if listener is added to an event type.
   * @param type The type of event to listen to.
   * @param listener The function that gets called when the event is fired.
   */
  hasEventListener<T extends Extract<keyof TEventMap, string>>(type: T, listener: FnEvtListener<TEventMap[T]>): boolean;

  /**
   * Removes a listener from an event type.
   * @param type The type of the listener that gets removed.
   * @param listener The listener function that gets removed.
   */
  removeEventListener<T extends Extract<keyof TEventMap, string>>(type: T, listener: FnEvtListener<TEventMap[T]>): void;

  /**
   * Removes all listeners
   */
  clearEventListeners(): void;

  /**
   * Fire an event type.
   * @param event The event that gets fired.
   */
  emit<T extends Extract<keyof TEventMap, string>>(type: T, event: TEventMap[T]): void;
}

declare interface Logger {
  debug(message: any, ...args: any[]): void;
  info(message: any, ...args: any[]): void;
  warn(message: any, ...args: any[]): void;
  error(message: any, ...args: any[]): void;
}

declare interface Address {
  /** 接收消息的 socket 的地址 */
  address: string;
  /** 端口号 */
  port: number;
}

declare interface AddressInfo extends Address {
  /** 使用的协议族，为 IPv4 或者 IPv6 */
  family: string
}

declare interface RemoteAddressInfo extends AddressInfo {
  /** message 的大小，单位：字节 */
  size: number;
}

declare type UDPSocketEventMap = {
  error: any;
  message: {
    data: string | ArrayBuffer;
    rinfo: RemoteAddressInfo;
  };
  listening: any;
};

declare class UDPSocket<TEventMap extends UDPSocketEventMap = UDPSocketEventMap> extends EventEmitter<TEventMap> {
  setTTL(value: number): void;
  setBroadcast(flag: boolean): void;
  bind(port: number): number;
  connect(address: string, port: number): void;
  send(msg: string | Uint8Array, offset: number, length: number, address: Address): void;
  close(): void;
}

declare type HnetPointType = 'cp' | 'host';
/** point uuid */
declare type PUID = string;

declare type HnetAddress = {
  uuid: PUID;
  type: HnetPointType;
  host: string;
  port: number;
  name: string;
}

declare type HnetFrom = { from: HnetAddress; }

declare type HnetResponse = HnetFrom & {
  code: number;
  err?: string;
};

declare type HnetChnnID = number;
declare interface HnetChannel {
  id: HnetChnnID;
  name: string;
}

declare type HnetCommandMap = {
  search: {
    req: HnetFrom & { type: HnetPointType | '*'; };
    rsp: HnetResponse;
  },
  alive: {
    req: HnetFrom & { channels: HnetChannel[]; };
    rsp: undefined;
  },
  bye: {
    req: HnetFrom;
    rsp: undefined;
  },
  data: {
    req: HnetFrom & {
      chnn: HnetChnnID;
      data: string | Uint8Array;
    };
    rsp: undefined;
  },
};

declare type HnetCommand = keyof HnetCommandMap;

declare class HnetMessage<T extends Extract<keyof HnetCommandMap, string>, D extends 'req' | 'rsp' = 'req'> {
  readonly id: number;
  readonly isr: boolean;
  readonly fields: HnetCommandMap[T][D];

  constructor(type: T, fields?: Partial<HnetCommandMap[T][D]> | string);

  fromBuffer(buffer: Uint8Array): this;
  toBuffer(isr?: boolean): Uint8Array;
}

declare type HnetEventMap = {
  alive: HnetFrom;
  bye: HnetFrom;
  found: HnetAddress;
  data: HnetCommandMap['data']['req'];
};

declare type HnetHost = HnetAddress & {
  active: number;
};

/** without host */
declare type Options = Omit<HnetAddress, 'host'>;

export declare class HnetSpot extends EventEmitter<HnetEventMap> {
  public readonly options: Required<Options>;
  public readonly hosts: Record<PUID, HnetHost>;
  protected readonly channels: HnetChannel[];

  constructor(sigso: UDPSocket, datso: UDPSocket, opts?: Partial<Options>, logger?: Logger);

  /** start */
  start(): boolean;

  /** stop */
  stop(): void;

  /** for channel */
  addChannel(channel: HnetChannel): boolean;
  removeChannel(id: HnetChnnID): void;

  /** send message through data socket */
  send(message: HnetMessage<any, any>, target: Pick<HnetAddress, 'host' | 'port'>): void;

  /** search points with type */
  search(type?: HnetPointType | '*'): void;
}
