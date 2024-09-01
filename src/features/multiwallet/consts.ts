import { Entries } from './types';
import polkadotSvg from '../multiwallet/assets/polkadot.svg';
import subwalletSvg from '../multiwallet/assets/subwallet.svg';
import talismanSvg from '../multiwallet/assets/talisman.svg';
import enkryptSvg from '../multiwallet/assets/enkrypt.svg';


const WALLET = {
  'polkadot-js': { name: 'Polkadot JS', image: polkadotSvg  },
  'subwallet-js': { name: 'SubWallet', image:  subwalletSvg }, 
  'talisman': { name: 'Talisman', image: talismanSvg },
  'enkrypt': { name: 'Enkrypt', image: enkryptSvg }, 
};

const WALLETS = Object.entries(WALLET) as Entries<typeof WALLET>;

export { WALLET, WALLETS };
