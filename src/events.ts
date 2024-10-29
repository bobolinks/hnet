export type FnEvtListener<TEventData> = (event: TEventData) => void;

/* From threejs EventDispatcher */
export class EventEmitter<TEventMap extends {} = {}> {
  private _listeners: Record<string, any> = {};

  /**
   * Adds a listener to an event type.
   * @param type The type of event to listen to.
   * @param listener The function that gets called when the event is fired.
   */
  addEventListener<T extends Extract<keyof TEventMap, string>>(type: T, listener: FnEvtListener<TEventMap[T]>): void {
    if (this._listeners === undefined) this._listeners = {};

    const listeners = this._listeners;

    if (listeners[type] === undefined) {
      listeners[type] = [];
    }

    if (listeners[type].indexOf(listener) === - 1) {
      listeners[type].push(listener);
    }
  }
  on<T extends Extract<keyof TEventMap, string>>(type: T, listener: (event: TEventMap[T]) => void): void {
    return this.addEventListener(type, listener);
  }
  once<T extends Extract<keyof TEventMap, string>>(type: T, listener: (event: TEventMap[T]) => void): void {
    const lis = (event: TEventMap[T]) => {
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
  hasEventListener<T extends Extract<keyof TEventMap, string>>(type: T, listener: FnEvtListener<TEventMap[T]>): boolean {
    if (this._listeners === undefined) return false;

    const listeners = this._listeners;

    return listeners[type] !== undefined && listeners[type].indexOf(listener) !== - 1;
  }

  /**
   * Removes a listener from an event type.
   * @param type The type of the listener that gets removed.
   * @param listener The listener function that gets removed.
   */
  removeEventListener<T extends Extract<keyof TEventMap, string>>(type: T, listener: FnEvtListener<TEventMap[T]>): void {
    if (this._listeners === undefined) return;

    const listeners = this._listeners;
    const listenerArray = listeners[type];

    if (listenerArray !== undefined) {
      const index = listenerArray.indexOf(listener);
      if (index !== - 1) {
        listenerArray.splice(index, 1);
      }
    }
  }

  /**
   * Removes all listeners
   */
  clearEventListeners(): void {
    if (Object.keys(this._listeners).length) {
      this._listeners = {};
    }
  }

  /**
   * Fire an event type.
   * @param event The event that gets fired.
   */
  emit<T extends Extract<keyof TEventMap, string>>(type: T, event: TEventMap[T]): void {
    if (this._listeners === undefined) return;

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
