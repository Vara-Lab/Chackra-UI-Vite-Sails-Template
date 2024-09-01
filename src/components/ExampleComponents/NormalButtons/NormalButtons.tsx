import { Button } from '@gear-js/vara-ui';
import { useAccount, useAlert } from '@gear-js/react-hooks';
import { useSailsCalls } from '@/app/hooks';
import { web3FromSource } from '@polkadot/extension-dapp';
import { Signer } from '@polkadot/types/types';
import { HexString } from '@gear-js/api';
import '../ButtonsContainer.css';

export const NormalButtons = () => {
    const { account } = useAccount();
    const sails = useSailsCalls();
    const alert = useAlert();

    const getUserSigner = (): Promise<[HexString, Signer]> => {
        return new Promise(async (resolve, reject) => {
            if (!account) {
                alert.error("Accounts not ready!");
                reject('Account not ready!');
                return;
            }

            const { signer } = await web3FromSource(account.meta.source);
            resolve([account.decodedAddress, signer]);
        })
    }

    return (
        <div className='buttons-container'>
            <Button onClick={async () => {
                if (!sails) {
                    alert.error('SailsCalls is not ready!');
                    return;
                }

                const [ userAddress, signer ] = await getUserSigner();

                try {
                    const response = await sails.command(
                        'Ping/Ping',
                        {
                            userAddress,
                            signer
                        },
                        {
                            callbacks: {
                                onSuccess() { alert.success('Message send!') },
                                onError() { alert.error('Error while sending message!') },
                                onBlock(blockHash) { alert.info(`Message in block: ${blockHash}`) },
                                onLoad() { alert.info('Will send a message') }
                            }
                        }
                    );

                    console.log(`Response: ${Object.keys(response)[0]}`);
                } catch (e) {
                    alert.error('Error while sending message');
                }
            }}>
                Send Ping
            </Button>
            <Button onClick={async () => {
                if (!sails) {
                    alert.error('SailsCalls is not ready!');
                    return;
                }

                const [ userAddress, signer ] = await getUserSigner();

                try {
                    const response = await sails.command(
                        'Ping/Pong',
                        {
                            userAddress,
                            signer
                        },
                        {
                            callbacks: {
                                onSuccess() { alert.success('Message send!') },
                                onError() { alert.error('Error while sending message!') },
                                onBlock(blockHash) { alert.info(`Message in block: ${blockHash}`) },
                                onLoad() { alert.info('Will send a message') },
                            }
                        }
                    );

                    console.log(`Response: ${Object.keys(response)[0]}`);
                } catch (e) {
                    alert.error('Error while sending message');
                }
            }}>
                Send Pong
            </Button>
        </div>
    )
}
