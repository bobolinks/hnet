
import * as Is from './is';

/**
 * BinJson codec
 */
enum TagCode {
  undefined = 'u'.charCodeAt(0),
  null = 'n'.charCodeAt(0),
  boolean = 'b'.charCodeAt(0),
  uint8Array = 'B'.charCodeAt(0),
  number = 'i'.charCodeAt(0),
  bigint = 'I'.charCodeAt(0),
  string = 's'.charCodeAt(0),
  object = 'd'.charCodeAt(0),
  array = 'a'.charCodeAt(0),
  end = 'e'.charCodeAt(0),
  colon = ':'.charCodeAt(0),
  one = '1'.charCodeAt(0),
}

export type ValPrimeType = undefined | null | boolean | Uint8Array | number | bigint | string;
export type ValDict = Record<string, ValPrimeType>;
export type ValType = ValPrimeType | Array<ValPrimeType | ValDict> | Record<string, ValPrimeType | ValDict>;

export function stringToUint8Array(str: string) {
  const len = str.length;
  const bytes: number[] = [];

  for (let i = 0; i < len; i++) {
    const c = str.charCodeAt(i);

    if ((c >= 0x0001) && (c <= 0x007F)) {
      bytes.push(c);
    } else if (c > 0x07FF) {
      bytes.push(0xE0 | ((c >> 12) & 0x0F));
      bytes.push(0xE0 | ((c >> 6) & 0x3F));
      bytes.push(0xE0 | (c & 0x3F));
    } else {
      bytes.push(0xC0 | ((c >> 12) & 0x1F));
      bytes.push(0x80 | (c & 0x3F));
    }
  }
  return new Uint8Array(bytes);
}

export function uint8ArrayToString(b: Uint8Array) {
  const len = b.length;
  const chars: number[] = [];
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
    } else {
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
  array: Uint8Array = new Uint8Array(1024);
  append(b: Uint8Array | string) {
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
  appendStringWithTag(s: string) {
    const b = stringToUint8Array(s);
    this.append(`s${b.length}:`);
    this.append(b);
  }
  appendTag(b: TagCode) {
    if ((this.offset + 1) >= this.array.length) {
      const n = new Uint8Array(this.offset + 1024);
      n.set(this.array);
      this.array = n;
    }
    this.array[this.offset] = b;
    this.offset += 1;
  }
  final(): Uint8Array {
    return this.array.subarray(0, this.offset);
  }
}

export default {
  encode<T extends ValType>(object: T, out?: ScalableArray): ScalableArray {
    const buffer = out || new ScalableArray();
    const type = typeof object;
    const func = ({
      string: (value: string) => buffer.appendStringWithTag(value),
      number: (value: number) => buffer.append(`i${value}e`),
      bigint: (value: bigint) => buffer.append(`I${value}e`),
      boolean: (value: boolean) => buffer.append(`b${value ? 1 : 0}`),
      undefined: () => buffer.appendTag(TagCode.undefined),
      symbol: () => { },
      object: (value: null | ValType | ValDict) => {
        if (value === null) {
          return buffer.appendTag(TagCode.null);
        } if (Is.array(value)) {
          buffer.append(`a${value.length}:`);
          for (const item of value) {
            this.encode(item, buffer);
          }
        } else if (value instanceof Uint8Array) {
          buffer.append(`B${value.length}:`);
          buffer.append(value);
        } else {
          const keys = Object.keys(value as ValDict);
          buffer.append(`d${keys.length}:`);
          for (const key of keys) {
            this.encode(key, buffer);
            const item = (value as ValDict)[key];
            this.encode(item, buffer);
          }
        }
      },
      function: () => { },
    })[type] as any;

    if (func) {
      func(object);
    }
    return buffer;
  },

  decode<T extends ValType>(buffer: Uint8Array, cxt = { pos: 0 }): T {
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
        const r: any = {};
        for (let i = 0; i < size; i++) {
          r[this.decode<any>(buffer, cxt)] = this.decode(buffer, cxt);
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