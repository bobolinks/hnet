'use strict';

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

class UDPSocket extends EventEmitter {
    native = wx.createUDPSocket();
    isBroadcast = false;
    constructor() {
        super();
        this.native.onMessage((result) => {
            this.emit('message', { data: result.message, rinfo: result.remoteInfo });
        });
    }
    setTTL(value) {
        this.native.setTTL(value);
    }
    setBroadcast(flag) {
        this.isBroadcast = flag;
    }
    bind(port) {
        const r = this.native.bind(port);
        this.emit('listening', {});
        return r;
    }
    connect(address, port) {
        this.native.connect({ address, port });
    }
    send(msg, offset, length, address) {
        this.native.send({
            message: msg,
            offset,
            length,
            port: address.port,
            address: address.address,
            setBroadcast: this.isBroadcast ?? undefined,
        });
    }
    close() {
        this.native.close();
    }
}

exports.UDPSocket = UDPSocket;
//# sourceMappingURL=so.wx.cjs.map
