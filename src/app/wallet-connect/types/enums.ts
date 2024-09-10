
export enum WalletProviderType {
    Talisman = "talisman",
    SubwalletJS = "subwallet-js",
    PolkadotJS = "polkadot-js",
    NovaWallet = "nova-wallet",
    Enkrypt = "enkrypt",
    WalletConnect = "walletconnect",
  }
  
  export enum WalletProviderStatus {
    Connected = "connected",
    Pending = "pending",
    Disconnected = "disconnected",
    Error = "error",
  }
  
  export enum WalletMode {
    Default = "default",
    Substrate = "substrate",
    SubstrateEVM = "substrate-evm",
  }
  
  export enum ModalPage {
    ProviderSelect,
    External,
    AccountSelect,
    Error,
    AddressBook,
  }


