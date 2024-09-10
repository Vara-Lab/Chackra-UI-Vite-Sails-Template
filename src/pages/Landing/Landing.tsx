import { useWalletConnect } from "@/app/wallet-connect/hooks/useWalletConnect";
import { useSignAndSendTransfer } from "@/app/wallet-connect/hooks/useSignAndSendTransfer";
import { Center, VStack, Image } from "@chakra-ui/react";
import { Heading } from "@/components/ui/heading";
import { Button } from "@chakra-ui/react";
import { Button as VaraButton } from "@/components/ui/button";
import { Link } from "react-router-dom";

function Landing() {
  // Using the hook to connect to WalletConnect
  const { enableWalletConnect, connected, accounts, signTransaction } =
    useWalletConnect();

  // Hook to sign and send a transfer
  const { signAndSendTransfer, txHash, isSigning, error } =
    useSignAndSendTransfer(accounts, signTransaction);

  // Recipient address and amount to send
  const recipient = "kGggpCH2Rgzp5VcpBei9MS2B2PiJn9Kg92XK19mMwc7zZBcVG";
  const amount = 3000000000000;

  const sendTransaction = () => {
    signAndSendTransfer(recipient, amount);
  };

  return (
    <Center>
      <VStack>
        <Button textColor="black" bg="#00ffc4" as={Link} to="/home">
          Examples
        </Button>

        <Center>
          <VStack>
            {connected ? (
              <></>
            ) : (
              <>
                <Image
                  src="https://walletconnect.com/static/favicon.png"
                  w="70px"
                  h="70px"
                />
                <VaraButton onClick={enableWalletConnect}>
                  {connected ? "Wallet Connected" : "Connect Wallet"}
                </VaraButton>
              </>
            )}
            {connected && (
              <>
                <VStack>
                  <Heading size="xs">
                    Accounts: {accounts.map((acc) => acc.address).join(", ")}
                  </Heading>
                  <VaraButton
                    onClick={() => sendTransaction()}
                    disabled={isSigning}
                  >
                    {isSigning ? "Signing Transaction..." : "Sign Transaction"}
                  </VaraButton>
                  <Heading size="xs">
                    {txHash && <div>Transaction Id: {txHash}</div>}
                    {error && <div>Error: {error}</div>}
                  </Heading>
                </VStack>
              </>
            )}
          </VStack>
        </Center>
      </VStack>
    </Center>
  );
}

export { Landing };
