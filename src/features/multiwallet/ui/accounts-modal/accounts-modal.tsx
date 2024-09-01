import { decodeAddress } from "@gear-js/api";
import { useAccount, useAlert } from "@gear-js/react-hooks";
import { Button, Modal, buttonStyles } from "@gear-js/ui";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import { isWeb3Injected } from "@polkadot/extension-dapp";
import SimpleBar from "simplebar-react";
import { AiOutlineLogout, AiOutlineCopy } from "react-icons/ai";
import { AccountButton } from "../account-button";
import { useWallet } from "../../hooks";
import { WALLETS } from "../../consts";
import { Card, HStack, Image, VStack } from "@chakra-ui/react";
import { Heading } from "@/components/ui/heading";
import cx from "clsx";
import styles from "./accounts-modal.module.scss";

type Props = {
  close: () => void;
};

const AccountsModal = ({ close }: Props) => {
  const { account, extensions, login, logout } = useAccount();

  const alert = useAlert();

  const {
    wallet,
    walletAccounts,
    setWalletId,
    resetWalletId,
    getWalletAccounts,
  } = useWallet();

  const handleLogoutClick = () => {
    logout();
    close();
  };

  const handleAccountClick = (newAccount: InjectedAccountWithMeta) => {
    login(newAccount);
    close();
  };

  const heading = wallet ? "Connect account" : "Choose Wallet";
  const modalClassName = cx(styles.modal, !isWeb3Injected && styles.empty);

  const getWallets = () =>
    WALLETS.map(([id, { image, name }]: any) => {
      const isEnabled = extensions?.some((extension) => extension.name === id);

      const accountsCount = getWalletAccounts(id)?.length;
      const accountsStatus = `${accountsCount} ${
        accountsCount === 1 ? "account" : "accounts"
      }`;

      const buttonClassName = cx(
        buttonStyles.button,
        buttonStyles.large,
        buttonStyles.block,
        styles.button,
        isEnabled && styles.enabled
      );

      return (
        <li key={id} style={{ marginBottom: '20px' }}>
          <button className={buttonClassName} onClick={() => setWalletId(id)}>
            <span>
              <img src={image} alt={name} width="30" height="30" />
              <p>{name}</p>
            </span>
            <div>
              <p className={styles.status}>
                {isEnabled ? "Enabled" : "Disabled"}
              </p>
              {isEnabled && (
                <p className={styles.statusAccounts}>{accountsStatus}</p>
              )}
            </div>
          </button>
        </li>
      );
    });

  const getAccounts = () =>
    walletAccounts?.map((_account) => {
      const { address, meta } = _account;
      const isActive = address === account?.address;

      const handleClick = () => {
        if (isActive) return;
        handleAccountClick(_account);
      };

      return (
        <Card backgroundColor="#02f8bf" border="3px solid black" key={address}>
          <HStack>
            <AccountButton
              name={meta.name}
              address={address}
              onClick={handleClick}
            />
          </HStack>
        </Card>
      );
    });

  return (
    <Modal heading={heading} close={close} className={modalClassName}>
      {isWeb3Injected ? (
        <>
          <SimpleBar  className={styles.simplebar}>
            {!wallet && <ul>{getWallets()}</ul>}

            {!!wallet &&
              (walletAccounts?.length ? (
                <ul>{getAccounts()}</ul>
              ) : (
                <Heading color="white" size="xs">
                  No accounts found. Please open your Polkadot extension and
                  create a new account or import existing. Then reload this
                  page.
                </Heading>
              ))}
          </SimpleBar>

          <footer>
            {wallet && (
              <Button
                text={wallet.name}
                color="transparent"
                onClick={resetWalletId}
              />
            )}

            <Button
              icon={AiOutlineLogout}
              text="Logout"
              color="transparent"
              onClick={handleLogoutClick}
            />
          </footer>
        </>
      ) : (
        <p>
          Wallet extension was not found or disconnected. Please check how to
          install a supported wallet and create an account{" "}
          <a
            href="https://wiki.gear-tech.io/docs/idea/account/create-account"
            target="_blank"
            rel="noreferrer"
            className="link-text"
          >
            here
          </a>
          .
        </p>
      )}
    </Modal>
  );
};

export { AccountsModal };
