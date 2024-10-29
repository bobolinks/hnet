import codec from './codec';

let autoIncID = Math.ceil(Math.random() * 100000);

export const HexChars = '0123456789abcdef'.split('');

export function randomChoice(arr: Array<any>, remove?: boolean) {
  const i = Math.floor(Math.random() * arr.length);
  if (remove)
    return arr.splice(i, 1)[0];
  return arr[i];
}

export function randomHex(len: number): string {
  return new Array(len).fill(0).map(() => randomChoice(HexChars)).join('');
}

export class HnetMessage<T extends Extract<keyof HnetCommandMap, string>, D extends 'req' | 'rsp' = 'req'> {
  public readonly id = autoIncID++;
  public readonly fields: HnetCommandMap[T][D] = {} as any;

  constructor(public readonly type: T, fields: Partial<HnetCommandMap[T][D]> | Uint8Array, public readonly isr = false) {
    if (fields instanceof Uint8Array) {
      this.fromBuffer(fields);
    } else {
      Object.assign(this.fields!, fields);
    }
  }

  fromBuffer(buffer: Uint8Array): this {
    const pack: any = codec.decode(buffer);
    if (pack.id) {
      (this as any).id = pack.id;
    }
    if (pack.type) {
      (this as any).type = pack.type;
    }
    if (pack.isr) {
      (this as any).isr = pack.isr;
    }
    if (pack.fields) {
      Object.assign(this.fields!, pack.fields);
    }
    return this;
  }
  toBuffer(): Uint8Array {
    const pack: any = { id: this.id, type: this.type, fields: this.fields };
    if (this.isr) {
      pack.isr = this.isr;
    }
    return codec.encode(pack).final();
  }
}