import { namespaces, walletConnectParams } from "../constants/constants";
import { noop, shortenAccountAddress } from "../utils/utils";
import { WalletProviderType } from "../types/enums";
import { VaraSigner } from "./varaSigner";
import { SessionTypes } from "@walletconnect/types";
import { SignerPayloadJSON, SignerPayloadRaw } from "@polkadot/types/types";
import { Wallet, WalletAccount } from "@talismn/connect-wallets";
import { WalletConnectModal } from "@walletconnect/modal";
import {
  IUniversalProvider,
  NamespaceConfig,
  UniversalProvider,
} from "@walletconnect/universal-provider";
import { ModalSubFn, NamespaceType } from "../types/types";
import { projectId } from "../constants/constants";

export class WalletConnect implements Wallet {
  extensionName = WalletProviderType.WalletConnect;
  title = "WalletConnect";
  installUrl = "";
  logo = {
    src: "",
    alt: "WalletConnect Logo",
  };

  _modal: WalletConnectModal | undefined;
  _extension: IUniversalProvider | undefined;
  _signer: VaraSigner | undefined;
  _session: SessionTypes.Struct | undefined;
  _namespace: NamespaceConfig | undefined;
  _instance: IUniversalProvider | undefined;

  onSessionDelete: () => void = noop;

  constructor({
    onModalOpen,
    onModalClose,
    onSesssionDelete,
  }: {
    onModalOpen?: ModalSubFn;
    onModalClose?: ModalSubFn;
    onSesssionDelete?: () => void;
  } = {}) {
    this._modal = new WalletConnectModal({
      projectId: projectId,
    });

    this.subscribeToModalEvents(onModalOpen, onModalClose);

    if (onSesssionDelete) this.onSessionDelete = onSesssionDelete;
  }

  getInstance = async () => {
    if (!this._instance) {
      this._instance = await UniversalProvider.init(walletConnectParams);
    }

    return this._instance;
  };

  get extension() {
    return this._extension;
  }

  get signer() {
    return this._signer;
  }

  get modal() {
    return this._modal;
  }

  get namespace() {
    return this._namespace;
  }

  get installed() {
    return true;
  }

  get rawExtension() {
    return this._extension;
  }

  initializeProvider = async () => {
    await this._extension?.cleanupPendingPairings();
    await this._extension?.disconnect();

    const provider = await this.getInstance();

    if (!provider) {
      throw new Error(
        "WalletConnectError: Connection failed. Please try again."
      );
    }

    this._extension = provider;
    //@ts-ignore WC types are not up to date
    provider.on("display_uri", this.handleDisplayUri);
    //@ts-ignore WC types are not up to date
    provider.on("session_update", this.handleSessionUpdate);
    //@ts-ignore WC types are not up to date
    provider.on("session_delete", this.handleSessionDelete);

    return provider;
  };

  transformError = (err: Error): Error => {
    return err;
  };

  setNamespace = async (namespace: keyof typeof namespaces) => {
    this._namespace = {
      [namespace]: namespaces[namespace],
    };
  };

  getChains = () => {
    if (!this.namespace) return [];

    return Object.values(this.namespace)
      .map((namespace) => namespace.chains)
      .flat();
  };

  subscribeToModalEvents = (onOpen?: ModalSubFn, onClose?: ModalSubFn) => {
    this.modal?.subscribeModal((state) => {
      if (state.open) {
        onOpen?.();
      } else {
        onClose?.(this._session);

        if (!this._session) {
          this.disconnect();
        }
      }
    });
  };

  handleDisplayUri = async (uri: string) => {
    await this.modal?.openModal({ uri, chains: this.getChains() });
  };

  handleSessionUpdate = ({ session }: { session: SessionTypes.Struct }) => {
    this._session = session;
  };

  handleSessionDelete = () => {
    this.disconnect();
    this.onSessionDelete();
  };

  enable = async (dappName: string) => {
    if (!dappName) {
      throw new Error("MissingParamsError: Dapp name is required.");
    }

    const provider = await this.initializeProvider();

    if (!provider) {
      throw new Error(
        "WalletConnectError: WalletConnect provider is not initialized."
      );
    }

    if (!this.namespace) {
      throw new Error(
        "WalletConnectError: Namespace is required to enable WalletConnect."
      );
    }

    try {
      const session = await provider.connect({
        optionalNamespaces: this.namespace,
      });

      if (!session) {
        throw new Error("WalletConnectError: Failed to create WalletConnect .");
      }

      this._session = session;

      const namespace = Object.keys(this.namespace).pop() as NamespaceType;

      if (namespace === "polkadot" && provider.client) {
        this._signer = new VaraSigner(provider.client, session);
      }
    } finally {
      this.modal?.closeModal();
    }
  };

  getAccounts = async (): Promise<WalletAccount[]> => {
    if (!this._session) {
      throw new Error(
        `The 'Wallet.enable(dappname)' function should be called first.`
      );
    }

    const wcAccounts = Object.values(this._session.namespaces)
      .map((namespace) => namespace.accounts)
      .flat();

    // return only first (active) account
    return wcAccounts.slice(0, 1).map((wcAccount) => {
      const address = wcAccount.split(":")[2];
      return {
        address,
        source: this.extensionName,
        name: shortenAccountAddress(address),
        wallet: this,
        signer: this.signer,
      };
    });
  };

  async signTransaction(payload: SignerPayloadJSON): Promise<string> {
    if (!this._signer)
      throw new Error("No signer available. Connect Wallet first.");
    return (await this._signer.signPayload(payload)).signature;
  }

  async signMessage(raw: SignerPayloadRaw): Promise<string> {
    if (!this._signer)
      throw new Error("No signer available. Connect Wallet first.");
    return (await this._signer.signRaw(raw)).signature;
  }

  subscribeAccounts = async () => {};

  disconnect = () => {
    const provider = this._extension;
    provider?.off("display_uri", this.handleDisplayUri);
    provider?.off("session_update", this.handleSessionUpdate);
    provider?.off("session_delete", this.handleSessionDelete);

    provider?.cleanupPendingPairings();
    provider?.disconnect();

    this._signer = undefined;
    this._session = undefined;
    this._extension = undefined;
  };
}
