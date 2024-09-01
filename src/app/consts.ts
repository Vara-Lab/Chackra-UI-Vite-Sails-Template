import { HexString } from '@gear-js/api';

interface ContractSails {
  programId: HexString,
  idl: string
}

export const ACCOUNT_ID_LOCAL_STORAGE_KEY = 'account';

export const ADDRESS = {
  NODE: import.meta.env.VITE_NODE_ADDRESS,
  BACK: import.meta.env.VITE_BACKEND_ADDRESS,
  GAME: import.meta.env.VITE_CONTRACT_ADDRESS as HexString,
};

export const ROUTES = {
  HOME: '/',
  EXAMPLES: '/examples',
  NOTFOUND: '*',
};

// To use the example code, enter the details of the account that will pay the vouchers, etc. (name and mnemonic)
export const sponsorName = "";
export const sponsorMnemonic = "";

export const CONTRACT_DATA: ContractSails = {
  programId: '0xa5b1c2e460efed2066623fe9b64ff1f3f0f0f747750eea28e22dcc9084904932',
  idl: `
    type PingEvent = enum {
      Ping,
      Pong,
      SignlessError: SignlessError,
    };

    type SignlessError = enum {
      SignlessAccountHasInvalidSession,
      SignlessAccountNotApproved,
      SignlessAddressAlreadyEsists,
      UserAddressAlreadyExists,
      UserDoesNotHasSignlessAccount,
      NoWalletAccountAlreadyExists,
      NoWalletAccountDoesNotHasSignlessAccount,
      SessionHasInvalidSignlessAccount,
    };

    type QueryEvent = enum {
      LastWhoCall: actor_id,
      SignlessAccountAddress: opt actor_id,
      SignlessAccountData: opt SignlessAccount,
    };

    type SignlessAccount = struct {
      address: str,
      encoded: str,
    };

    type SignlessEvent = enum {
      SignlessAccountSet,
      Error: SignlessError,
    };

    constructor {
      New : ();
    };

    service Ping {
      Ping : () -> PingEvent;
      PingNoWallet : (no_wallet_name_encoded: str) -> PingEvent;
      PingSignless : (user_address: actor_id) -> PingEvent;
      Pong : () -> PingEvent;
      PongNoWallet : (no_wallet_name_encoded: str) -> PingEvent;
      PongSignless : (user_address: actor_id) -> PingEvent;
    };

    service QueryService {
      query LastWhoCall : () -> QueryEvent;
      query SignlessAccountData : (signless_address: actor_id) -> QueryEvent;
      query SignlessAddressFromNoWalletAccount : (no_wallet_account: str) -> QueryEvent;
      query SignlessAddressFromUserAddress : (user_address: actor_id) -> QueryEvent;
    };

    service Signless {
      BindSignlessDataToAddress : (user_address: actor_id, signless_data: SignlessAccount) -> SignlessEvent;
      BindSignlessDataToNoWalletAccount : (no_wallet_account: str, signless_data: SignlessAccount) -> SignlessEvent;
    };
  `
};