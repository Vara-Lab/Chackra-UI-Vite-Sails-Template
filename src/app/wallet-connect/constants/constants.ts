
export const projectId = import.meta.env.VITE_PROJECT_ID;
export const DOMAIN_URL = import.meta.env.VITE_DOMAIN_URL as string;

export const CAIP_ID_MAP = {
    //vara: "polkadot:fe1b4c55fd4d668101126434206571a7", // Vara Network Mainnet
    vara: "polkadot:525639f713f397dcf839bd022cd821f3",// Vara Network Testnet
  };
  
  export const walletConnectParams = {
    projectId: import.meta.env.VITE_PROJECT_ID,
    relayUrl: "wss://relay.walletconnect.com",
    metadata: {
      name: "vara",
      description: "vara",
      url: import.meta.env.VITE_DOMAIN_URL as string,
      icons: ["https://walletconnect.com/walletconnect-logo.png"],
    },
  };
  
  export const namespaces = {
    polkadot: {
      methods: ["polkadot_signTransaction", "polkadot_signMessage"],
      chains: Object.values(CAIP_ID_MAP),
      events: ["accountsChanged", "disconnect"],
    },
  };
  