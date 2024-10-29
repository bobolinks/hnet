export enum SSDPCommand {
  NOTIFY = 'notify',
  M_SEARCH = 'm-search',
};

export enum SSDPMessageType {
  SSDP_ALIVE = 'ssdp:alive',
  SSDP_BYE = 'ssdp:byebye',
  SSDP_ALL = 'ssdp:all',
};

/** broadcast port */
export const HNET_BROADCAST_PORT = 1901;
/** data port */
export const HNET_DATA_PORT = 1902;