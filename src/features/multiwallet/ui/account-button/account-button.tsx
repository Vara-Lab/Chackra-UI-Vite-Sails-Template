import { Heading } from "@/components/ui/heading";
import { HStack } from "@chakra-ui/react";
import Identicon from "@polkadot/react-identicon";

type Props = {
  name?: string;
  address: string;
  className?: string;
  onClick: () => void;
};

const AccountButton = ({ name, address, className, onClick }: Props) => {
  return (
    <button type="button" onClick={onClick}>
      <HStack>
        <Identicon value={address} size={24} theme="polkadot" />
        <span style={{ marginLeft: "8px" }}>
          <Heading size="xs">{name}</Heading>
        </span>
      </HStack>
    </button>
  );
};

export { AccountButton };
