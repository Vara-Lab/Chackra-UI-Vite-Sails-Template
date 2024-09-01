import { useAccount } from "@gear-js/react-hooks";
import { Button, buttonStyles } from "@gear-js/ui";
import { useState } from "react";
import { AccountsModal } from "../accounts-modal";
import { AccountButton } from "../account-button";
import { Balance } from "../balance";
import { HStack } from "@chakra-ui/react";

const MultiWallet = () => {
  const { account, isAccountReady } = useAccount();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <HStack>
      <Balance />
      {isAccountReady &&
        (account ? (
          <AccountButton
            name={account.meta.name}
            address={account.address}
            onClick={openModal}
          />
        ) : (
          <Button text="Connect" color="primary" onClick={openModal} />
        ))}

      {isModalOpen && <AccountsModal close={closeModal} />}
    </HStack>
  );
};

export { MultiWallet };
