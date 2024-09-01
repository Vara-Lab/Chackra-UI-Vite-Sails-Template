import { WALLET } from './consts';
import { HexString } from '@polkadot/util/types';

interface IBase {
  genesis: string;
  timestamp: string;
  blockHash: HexString;
}

type Entries<T> = {
    [K in keyof T]: [K, T[K]];
  }[keyof T][];
  

type WalletId = keyof typeof WALLET;

export type { WalletId, IBase,Entries };
