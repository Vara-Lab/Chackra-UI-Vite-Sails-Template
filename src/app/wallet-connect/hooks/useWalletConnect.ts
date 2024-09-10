import { useState } from "react";
import { WalletConnect } from "../services/WalletConnect";
import type { SignerPayloadJSON, SignerPayloadRaw } from "@polkadot/types/types";

export function useWalletConnect() {
  const [connected, setConnected] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [wcService] = useState(new WalletConnect()); 

  const enableWalletConnect = async () => {
    try {
      await wcService.setNamespace("polkadot");
      await wcService.enable("test");

      const accounts = await wcService.getAccounts();
      setAccounts(accounts);
      setConnected(true);
    } catch (error) {
      console.error("WalletConnect Error:", error);
    }
  };

  const signTransaction = async (payload: SignerPayloadJSON) => {
    if (!connected) {
      console.error("Wallet not connected");
      return;
    }
    try {
      const signature = await wcService.signTransaction(payload);
      return signature;
    } catch (error) {
      console.error("Error signing transaction:", error);
      throw error;
    }
  };

  const signMessage = async (raw: SignerPayloadRaw) => {
    if (!connected) {
      console.error("Wallet not connected");
      return;
    }
    try {
      const signature = await wcService.signMessage(raw);
      return signature;
    } catch (error) {
      console.error("Error signing message:", error);
      throw error;
    }
  };

  return {
    enableWalletConnect,
    connected,
    accounts,
    signTransaction,
    signMessage,
  };
}
