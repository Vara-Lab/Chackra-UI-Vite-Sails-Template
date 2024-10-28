import { Button } from '@gear-js/vara-ui';
import { useAccount, useAlert } from '@gear-js/react-hooks';
import { useSailsCalls } from '@/app/hooks';
import { web3FromSource } from '@polkadot/extension-dapp';
import '../ButtonsContainer.css';

export const NormalButtons = () => {
    const { account } = useAccount();
    const sails = useSailsCalls();
    const alert = useAlert();

    const sendMessageWithMethod = async (method: string) => {
        if (!sails) {
            alert.error('SailsCalls is not started!');
            return;
        }

        if (!account) {
            alert.error('Account is not ready');
            return;
        }

        const { signer } = await web3FromSource(account.meta.source);

        try {
            const response = await sails.command(
                method,
                {
                    userAddress: account.decodedAddress,
                    signer
                },
                {
                    callbacks: {
                        onLoad() { alert.info('Will send a message') },
                        onSuccess() { alert.success('Message send with signless account!') },
                        onBlock(blockHash) { alert.info(`Message in block: ${blockHash}`) },
                        onError() { alert.error('Error while sending message') }
                    }
                }
            );

            console.log("Response: ", Object.keys(response)[0]);
        } catch (e) {
            alert.error('Error while sending signless account');
            console.error(e);
            return;
        }
    }

    return (
        <div className='buttons-container'>
            <Button onClick={async () => {
                await sendMessageWithMethod('Ping/Ping');
            }}>
                Send Ping
            </Button>
            <Button onClick={async () => {
                await sendMessageWithMethod('Ping/Pong');
            }}>
                Send Pong
            </Button>
        </div>
    )
}
