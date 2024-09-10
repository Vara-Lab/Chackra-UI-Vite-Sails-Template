import type { HexString } from "@polkadot/util/types";
import { SessionTypes, SignClientTypes } from "@walletconnect/types";
import { WalletProviderType, WalletProviderStatus, WalletMode } from "./enums";
import { namespaces } from "../constants/constants";

export type KeypairType = "ed25519" | "sr25519";
export type WcAccount = `${string}:${string}:${string}`;
export interface WalletConnectConfiguration extends SignClientTypes.Options {}
export type ModalSubFn = (session?: SessionTypes.Struct) => void;
export type NamespaceType = keyof typeof namespaces;

export interface Signature {
  signature: HexString;
}

export type WalletProviderState = {
  open: boolean;
  provider: WalletProviderType | null;
  recentProvider: WalletProviderType | null;
  account: Account | null;
  status: WalletProviderStatus;
  mode: WalletMode;
  error?: string;
  meta?: WalletProviderMeta | null;
};

export type Account = {
  name: string;
  address: string;
  displayAddress?: string;
  genesisHash?: `0x${string}`;
  provider: WalletProviderType;
  isExternalWalletConnected?: boolean;
  delegate?: string;
};

export type WalletProviderMeta = {
  chain: string;
};

export type WalletProviderStore = WalletProviderState & {
  toggle: (mode?: WalletMode, meta?: WalletProviderMeta) => void;
  setAccount: (account: Account | null) => void;
  setProvider: (provider: WalletProviderType | null) => void;
  setStatus: (
    provider: WalletProviderType | null,
    status: WalletProviderStatus
  ) => void;
  setError: (error: string) => void;
  disconnect: () => void;
};
