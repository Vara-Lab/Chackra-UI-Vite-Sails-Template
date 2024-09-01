import { IBase } from './entities';

type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

export type { IBase, Entries };
