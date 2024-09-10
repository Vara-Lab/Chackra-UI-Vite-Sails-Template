import { useState, useCallback } from "react";
import { SignerPayloadJSON } from "@polkadot/types/types";
import { useApi } from "./useApi";

export const useSignAndSendTransfer = (
  accounts: any[],
  signTransaction: any
) => {
  const { api, isReady, error: apiError } = useApi();
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const signAndSendTransfer = useCallback(
    async (address: string, amount: any) => {
      if (!accounts || accounts.length === 0) {
        setError("No accounts available");
        return;
      }

      if (!isReady || !api) {
        setError("API is not ready");
        return;
      }

      setIsSigning(true);
      setError(null);

      try {
        const runtimeVersion = await api.rpc.state.getRuntimeVersion();
        const genesisHash = await api.rpc.chain.getBlockHash(0);
        const latestBlock = await api.rpc.chain.getHeader();
        const blockHash = latestBlock.hash.toHex();
        const blockNumber = latestBlock.number.toNumber();
        const era = api
          .createType("ExtrinsicEra", {
            current: latestBlock.number,
            period: 64,
          })
          .toHex();

        const { nonce }: any = await api.query.system.account(
          accounts[0].address
        );

        const extrinsic = api.tx.balances.transferKeepAlive(address, amount);

        const method = extrinsic.method.toHex();

        const payload: SignerPayloadJSON = {
          address: accounts[0].address,
          blockHash,
          blockNumber: api.registry
            .createType("BlockNumber", blockNumber)
            .toHex(),
          era,
          genesisHash: genesisHash.toHex(),
          method,
          nonce: api.registry.createType("Compact<Index>", nonce).toHex(),
          specVersion: api.registry
            .createType("u32", runtimeVersion.specVersion)
            .toHex(),
          tip: "0x00",
          transactionVersion: api.registry
            .createType("u32", runtimeVersion.transactionVersion)
            .toHex(),
          signedExtensions: api.registry.signedExtensions,
          version: 4,
        };

        const signature: any = await signTransaction(payload);

        const extrinsicPayload: any = {
          method: payload.method,
          blockHash: payload.blockHash,
          era: api.createType("ExtrinsicEra", payload.era),
          nonce: api.registry.createType("Index", payload.nonce).toNumber(),
          tip: api.registry.createType("Balance", payload.tip).toBn(),
          specVersion: api.createType("u32", payload.specVersion),
          transactionVersion: api.createType("u32", payload.transactionVersion),
          genesisHash: payload.genesisHash,
        };

        const signedExtrinsic = extrinsic.addSignature(
          payload.address,
          signature,
          extrinsicPayload
        );

        console.log("Signed Extrinsic", signedExtrinsic);

        const txId = await api.rpc.author.submitExtrinsic(signedExtrinsic);

        setTxHash(txId.toString());
        console.log("Transaction Id", txId.toString());

        return txId.toString();
      } catch (error: any) {
        setError(error.message);
        console.error("Error signing transaction:", error);
        return null;
      } finally {
        setIsSigning(false);
      }
    },
    [accounts, signTransaction]
  );

  return { signAndSendTransfer, txHash, isSigning, error };
};
