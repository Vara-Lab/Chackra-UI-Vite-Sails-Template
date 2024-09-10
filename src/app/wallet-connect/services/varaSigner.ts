import { TypeRegistry } from "@polkadot/types";
import type { Signer, SignerPayloadJSON, SignerPayloadRaw, SignerResult } from "@polkadot/types/types";
import SignClient from "@walletconnect/sign-client";
import { SessionTypes } from "@walletconnect/types";
import { CAIP_ID_MAP } from "../constants/constants";
import { Signature } from "../types/types";


export class VaraSigner implements Signer {
  registry: TypeRegistry;
  client: SignClient;
  session: SessionTypes.Struct;
  id = 0;

  constructor(client: SignClient, session: SessionTypes.Struct) {
    this.client = client;
    this.session = session;
    this.registry = new TypeRegistry();
  }

  signPayload = async (payload: SignerPayloadJSON): Promise<SignerResult> => {
    const chainId = CAIP_ID_MAP["vara"];

    let request = {
      topic: this.session.topic,
      chainId,
      request: {
        id: 1,
        jsonrpc: "2.0",
        method: "polkadot_signTransaction",
        params: { address: payload.address, transactionPayload: payload },
      },
    };
    let { signature } = await this.client.request<Signature>(request);
    return { id: ++this.id, signature };
  };

  signRaw = async (raw: SignerPayloadRaw): Promise<SignerResult> => {
    const chainId = CAIP_ID_MAP["vara"];
    let request = {
      topic: this.session.topic,
      chainId,
      request: {
        id: 1,
        jsonrpc: "2.0",
        method: "polkadot_signMessage",
        params: { address: raw.address, message: raw.data },
      },
    };
    let { signature } = await this.client.request<Signature>(request);
    return { id: ++this.id, signature };
  };
}
