import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { LOCAL_STORAGE } from "../../consts";

export { vouchersIdOfAddress, renewVoucher, addTokensToVoucher } from './vouchersUtils';

const isLoggedIn = ({ address }: InjectedAccountWithMeta) => localStorage[LOCAL_STORAGE.ACCOUNT] === address;

export { isLoggedIn };
