/* From threejs EventDispatcher */
class EventEmitter {
    _listeners = {};
    /**
     * Adds a listener to an event type.
     * @param type The type of event to listen to.
     * @param listener The function that gets called when the event is fired.
     */
    addEventListener(type, listener) {
        if (this._listeners === undefined)
            this._listeners = {};
        const listeners = this._listeners;
        if (listeners[type] === undefined) {
            listeners[type] = [];
        }
        if (listeners[type].indexOf(listener) === -1) {
            listeners[type].push(listener);
        }
    }
    on(type, listener) {
        return this.addEventListener(type, listener);
    }
    once(type, listener) {
        const lis = (event) => {
            this.removeEventListener(type, lis);
            listener.call(this, event);
        };
        return this.addEventListener(type, lis);
    }
    /**
     * Checks if listener is added to an event type.
     * @param type The type of event to listen to.
     * @param listener The function that gets called when the event is fired.
     */
    hasEventListener(type, listener) {
        if (this._listeners === undefined)
            return false;
        const listeners = this._listeners;
        return listeners[type] !== undefined && listeners[type].indexOf(listener) !== -1;
    }
    /**
     * Removes a listener from an event type.
     * @param type The type of the listener that gets removed.
     * @param listener The listener function that gets removed.
     */
    removeEventListener(type, listener) {
        if (this._listeners === undefined)
            return;
        const listeners = this._listeners;
        const listenerArray = listeners[type];
        if (listenerArray !== undefined) {
            const index = listenerArray.indexOf(listener);
            if (index !== -1) {
                listenerArray.splice(index, 1);
            }
        }
    }
    /**
     * Removes all listeners
     */
    clearEventListeners() {
        if (Object.keys(this._listeners).length) {
            this._listeners = {};
        }
    }
    /**
     * Fire an event type.
     * @param event The event that gets fired.
     */
    emit(type, event) {
        if (this._listeners === undefined)
            return;
        const listeners = this._listeners;
        const listenerArray = listeners[type];
        if (listenerArray !== undefined) {
            // Make a copy, in case listeners are removed while iterating.
            const array = listenerArray.slice(0);
            for (let i = 0, l = array.length; i < l; i++) {
                array[i].call(this, event);
            }
        }
    }
}

var version = "0.0.1";

var SSDPCommand;
(function (SSDPCommand) {
    SSDPCommand["NOTIFY"] = "notify";
    SSDPCommand["M_SEARCH"] = "m-search";
})(SSDPCommand || (SSDPCommand = {}));
var SSDPMessageType;
(function (SSDPMessageType) {
    SSDPMessageType["SSDP_ALIVE"] = "ssdp:alive";
    SSDPMessageType["SSDP_BYE"] = "ssdp:byebye";
    SSDPMessageType["SSDP_ALL"] = "ssdp:all";
})(SSDPMessageType || (SSDPMessageType = {}));
/** broadcast port */
const HNET_BROADCAST_PORT = 1901;
/** data port */
const HNET_DATA_PORT = 1902;

/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
function array(value) {
    return Array.isArray(value);
}

/**
 * BinJson codec
 */
var TagCode;
(function (TagCode) {
    TagCode[TagCode["undefined"] = 'u'.charCodeAt(0)] = "undefined";
    TagCode[TagCode["null"] = 'n'.charCodeAt(0)] = "null";
    TagCode[TagCode["boolean"] = 'b'.charCodeAt(0)] = "boolean";
    TagCode[TagCode["uint8Array"] = 'B'.charCodeAt(0)] = "uint8Array";
    TagCode[TagCode["number"] = 'i'.charCodeAt(0)] = "number";
    TagCode[TagCode["bigint"] = 'I'.charCodeAt(0)] = "bigint";
    TagCode[TagCode["string"] = 's'.charCodeAt(0)] = "string";
    TagCode[TagCode["object"] = 'd'.charCodeAt(0)] = "object";
    TagCode[TagCode["array"] = 'a'.charCodeAt(0)] = "array";
    TagCode[TagCode["end"] = 'e'.charCodeAt(0)] = "end";
    TagCode[TagCode["colon"] = ':'.charCodeAt(0)] = "colon";
    TagCode[TagCode["one"] = '1'.charCodeAt(0)] = "one";
})(TagCode || (TagCode = {}));
function stringToUint8Array(str) {
    const len = str.length;
    const bytes = [];
    for (let i = 0; i < len; i++) {
        const c = str.charCodeAt(i);
        if ((c >= 0x0001) && (c <= 0x007F)) {
            bytes.push(c);
        }
        else if (c > 0x07FF) {
            bytes.push(0xE0 | ((c >> 12) & 0x0F));
            bytes.push(0xE0 | ((c >> 6) & 0x3F));
            bytes.push(0xE0 | (c & 0x3F));
        }
        else {
            bytes.push(0xC0 | ((c >> 12) & 0x1F));
            bytes.push(0x80 | (c & 0x3F));
        }
    }
    return new Uint8Array(bytes);
}
function uint8ArrayToString(b) {
    const len = b.length;
    const chars = [];
    for (let i = 0; i < len; i++) {
        const c1 = b[i];
        if (!(c1 & 0x80)) {
            chars.push(c1);
            continue;
        }
        const c2 = b[i];
        if (!(c1 & 0x20)) {
            i++;
            const cs = (c1 & 0x1F) << 6 | (c2 & 0x3F);
            chars.push(cs);
        }
        else {
            i++;
            const c3 = b[i];
            const cs = ((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6) | (c3 & 0x3F);
            chars.push(cs);
        }
    }
    return chars.map(e => String.fromCharCode(e)).join('');
}
class ScalableArray {
    offset = 0;
    array = new Uint8Array(1024);
    append(b) {
        if (typeof b === 'string') {
            b = stringToUint8Array(b);
        }
        if ((this.offset + b.length) >= this.array.length) {
            const n = new Uint8Array(this.offset + b.length + 1024);
            n.set(this.array);
            this.array = n;
        }
        this.array.set(b, this.offset);
        this.offset += b.length;
    }
    appendStringWithTag(s) {
        const b = stringToUint8Array(s);
        this.append(`s${b.length}:`);
        this.append(b);
    }
    appendTag(b) {
        if ((this.offset + 1) >= this.array.length) {
            const n = new Uint8Array(this.offset + 1024);
            n.set(this.array);
            this.array = n;
        }
        this.array[this.offset] = b;
        this.offset += 1;
    }
    final() {
        return this.array.subarray(0, this.offset);
    }
}
var codec = {
    encode(object, out) {
        const buffer = out || new ScalableArray();
        const type = typeof object;
        const func = ({
            string: (value) => buffer.appendStringWithTag(value),
            number: (value) => buffer.append(`i${value}e`),
            bigint: (value) => buffer.append(`I${value}e`),
            boolean: (value) => buffer.append(`b${value ? 1 : 0}`),
            undefined: () => buffer.appendTag(TagCode.undefined),
            symbol: () => { },
            object: (value) => {
                if (value === null) {
                    return buffer.appendTag(TagCode.null);
                }
                if (array(value)) {
                    buffer.append(`a${value.length}:`);
                    for (const item of value) {
                        this.encode(item, buffer);
                    }
                }
                else if (value instanceof Uint8Array) {
                    buffer.append(`B${value.length}:`);
                    buffer.append(value);
                }
                else {
                    const keys = Object.keys(value);
                    buffer.append(`d${keys.length}:`);
                    for (const key of keys) {
                        this.encode(key, buffer);
                        const item = value[key];
                        this.encode(item, buffer);
                    }
                }
            },
            function: () => { },
        })[type];
        if (func) {
            func(object);
        }
        return buffer;
    },
    decode(buffer, cxt = { pos: 0 }) {
        const t = buffer[cxt.pos++];
        const f = ({
            [TagCode.array]: () => {
                const pose = buffer.indexOf(TagCode.colon, cxt.pos);
                const size = parseInt(uint8ArrayToString(buffer.subarray(cxt.pos, pose)), 10);
                /** skip `${size}:` */
                cxt.pos = pose + 1;
                const r = [];
                for (let i = 0; i < size; i++) {
                    r.push(this.decode(buffer, cxt));
                }
                return r;
            },
            [TagCode.boolean]: () => buffer[cxt.pos++] === TagCode.one,
            [TagCode.object]: () => {
                const pose = buffer.indexOf(TagCode.colon, cxt.pos);
                const size = parseInt(uint8ArrayToString(buffer.subarray(cxt.pos, pose)), 10);
                /** skip `${size}:` */
                cxt.pos = pose + 1;
                const r = {};
                for (let i = 0; i < size; i++) {
                    r[this.decode(buffer, cxt)] = this.decode(buffer, cxt);
                }
                return r;
            },
            [TagCode.number]: () => {
                const pose = buffer.indexOf(TagCode.end, cxt.pos);
                const { pos } = cxt;
                cxt.pos = pose + 1;
                return parseFloat(uint8ArrayToString(buffer.subarray(pos, pose)));
            },
            [TagCode.bigint]: () => {
                const pose = buffer.indexOf(TagCode.end, cxt.pos);
                const { pos } = cxt;
                cxt.pos = pose + 1;
                return BigInt(uint8ArrayToString(buffer.subarray(pos, pose)));
            },
            [TagCode.null]: () => null,
            [TagCode.string]: () => {
                const pose = buffer.indexOf(TagCode.colon, cxt.pos);
                const size = parseInt(uint8ArrayToString(buffer.subarray(cxt.pos, pose)), 10);
                const pos = pose + 1;
                /** skip `${length}:.[length]` */
                cxt.pos = pose + size + 1;
                return uint8ArrayToString(buffer.subarray(pos, pos + size));
            },
            [TagCode.uint8Array]: () => {
                const pose = buffer.indexOf(TagCode.colon, cxt.pos);
                const size = parseInt(uint8ArrayToString(buffer.subarray(cxt.pos, pose)), 10);
                const pos = pose + 1;
                /** skip `${length}:.[length]` */
                cxt.pos = pose + size + 1;
                return buffer.subarray(pos, pos + size);
            },
            [TagCode.undefined]: () => undefined,
        })[t];
        if (!f) {
            throw 'unkonwn encoding!';
        }
        return f();
    },
};

let autoIncID = Math.ceil(Math.random() * 100000);
const HexChars = '0123456789abcdef'.split('');
function randomChoice(arr, remove) {
    const i = Math.floor(Math.random() * arr.length);
    return arr[i];
}
function randomHex(len) {
    return new Array(len).fill(0).map(() => randomChoice(HexChars)).join('');
}
class HnetMessage {
    type;
    isr;
    id = autoIncID++;
    fields = {};
    constructor(type, fields, isr = false) {
        this.type = type;
        this.isr = isr;
        if (fields instanceof Uint8Array) {
            this.fromBuffer(fields);
        }
        else {
            Object.assign(this.fields, fields);
        }
    }
    fromBuffer(buffer) {
        const pack = codec.decode(buffer);
        if (pack.id) {
            this.id = pack.id;
        }
        if (pack.type) {
            this.type = pack.type;
        }
        if (pack.isr) {
            this.isr = pack.isr;
        }
        if (pack.fields) {
            Object.assign(this.fields, pack.fields);
        }
        return this;
    }
    toBuffer() {
        const pack = { id: this.id, type: this.type, fields: this.fields };
        if (this.isr) {
            pack.isr = this.isr;
        }
        return codec.encode(pack).final();
    }
}

function genUUID() {
    return `${randomHex(8)}-${randomHex(4)}-${randomHex(4)}-${randomHex(4)}-${randomHex(12)}`;
}
class HnetSpot extends EventEmitter {
    sigso;
    datso;
    logger;
    options = {
        uuid: genUUID(),
        type: 'host',
        port: HNET_DATA_PORT,
        name: `hnetspot/${version}`,
    };
    hosts = {};
    started = false;
    adTimer;
    /** broadcast port, default 1901 */
    sigport;
    channels = [];
    constructor(sigso, datso, opts, sigport, logger) {
        super();
        this.sigso = sigso;
        this.datso = datso;
        this.logger = logger;
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
            this.parseMessage(data, rinfo);
        });
        this.datso.on('message', ({ data, rinfo }) => {
            const msg = codec.decode(data);
            msg.fields.from.host = rinfo.address;
            // is response of searching?
            if (msg.isr) {
                this.parseResponse(msg, rinfo);
            }
            else {
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
    addChannel(channel) {
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
    removeChannel(id) {
        const index = this.channels.findIndex(e => e.id === id);
        if (index !== -1) {
            this.channels.splice(index, 1);
            this.advertise(true);
        }
    }
    send(message, target) {
        const buf = message.toBuffer();
        this.datso.send(buf, 0, buf.length, { address: target.host, port: target.port });
    }
    /** search points with type */
    search(type) {
        const from = {
            from: { host: '', ...this.options, },
            type: type || '*',
        };
        const msg = new HnetMessage('search', from);
        this.broadcast(msg);
    }
    advertise(alive) {
        const req = {
            from: { host: '', ...this.options }
        };
        if (alive) {
            req.channels = this.channels;
        }
        const msg = new HnetMessage(alive ? 'alive' : 'bye', req);
        this.broadcast(msg);
    }
    /**
     * Routes a network message to the appropriate handler.
     *
     * @param msg
     * @param rinfo
     */
    parseMessage(buffer, rinfo) {
        const msg = codec.decode(new Uint8Array(buffer));
        // is from me ?
        if (msg.fields.from.uuid === this.options.uuid) {
            return;
        }
        msg.fields.from.host = rinfo.address;
        if (msg.isr) {
            this.parseResponse(msg, rinfo);
        }
        else {
            this.parseCommand(msg, rinfo);
        }
    }
    /**
     * Parses SSDP command.
     *
     * @param msg
     * @param rinfo
     */
    parseCommand(msg, rinfo) {
        switch (msg.type) {
            case 'alive':
                {
                    if (msg.fields.from.type !== 'host') {
                        return;
                    }
                    const host = { ...msg.fields.from, host: rinfo.address, active: Date.now() };
                    this.hosts[host.uuid] = host;
                    this.emit('alive', msg.fields);
                    if (this.logger) {
                        this.logger.info(`Alive message from ${host.host}:${host.port} [${host.name}]`);
                    }
                }
                break;
            case 'bye':
                {
                    if (msg.fields.from.type !== 'host') {
                        return;
                    }
                    delete this.hosts[msg.fields.from.uuid];
                    this.emit('bye', msg.fields);
                    if (this.logger) {
                        this.logger.info(`Bye message from ${msg.fields.from.host}:${msg.fields.from.port} [${msg.fields.from.name}]`);
                    }
                }
                break;
            case 'search':
                this.handleSearch(msg, rinfo);
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
    handleSearch(msg, rinfo) {
        if (msg.fields.type !== '*' && msg.fields.type !== this.options.type) {
            return;
        }
        if (this.logger) {
            this.logger.info(`Search message from ${msg.fields.from.host}:${msg.fields.from.port} [${msg.fields.from.name}]`);
        }
        const from = {
            from: { host: '', ...this.options },
            code: 0,
        };
        const rsp = new HnetMessage('search', from, true);
        this.send(rsp, msg.fields.from);
    }
    /**
     * Parses SSDP response message.
     *
     * @param msg
     * @param rinfo
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    parseResponse(msg, rinfo) {
        if (this.logger) {
            this.logger.info(`Response from ${msg.fields.from.host}:${msg.fields.from.port} [${msg.fields.from.name}]`);
        }
        if (msg.type === 'search') {
            this.emit('found', msg.fields.from);
        }
    }
    broadcast(message) {
        const buf = message.toBuffer();
        this.sigso.send(buf, 0, buf.length, { address: '255.255.255.255', port: this.sigport });
    }
}

export { EventEmitter, HnetSpot, codec };
//# sourceMappingURL=index.module.js.map
