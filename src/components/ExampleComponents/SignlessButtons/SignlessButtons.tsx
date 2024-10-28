import { useState } from 'react'
import { Button } from '@gear-js/vara-ui';
import { useAccount, useAlert } from '@gear-js/react-hooks';
import { useDAppContext } from '@/Context/dappContext';
import { SignlessForm } from '../../SignlessForm/SignlessForm';
import { decodeAddress } from '@gear-js/api';
import { useSailsCalls } from '@/app/hooks';
import { renewVoucher, addTokensToVoucher } from '@/app/utils';
import '../ButtonsContainer.css';


export const SignlessButtons = () => {
    const sails = useSailsCalls();
    const alert = useAlert();

    const { account } = useAccount();
    const { 
        currentVoucherId,
        signlessAccount,
        noWalletSignlessAccountName,
    } = useDAppContext();

    const [userFillingTheForm, setUserFillingTheForm] = useState(false);

    const sendMessageWithPayload = async (method: string, payload: any) => {
        if (!sails) {
            alert.error('SailsCalls is not started!');
            return;
        }

        if (!signlessAccount) {
            alert.error('no signless account!');
            return
        }

        if (!currentVoucherId) {
            alert.error('No voucher for sigless account!');
            return;
        }

        try {
            await renewVoucher(
                sails,
                decodeAddress(signlessAccount.address),
                currentVoucherId,
                1_200, // 1200 blocks one hour
                {
                    onLoad() { alert.info('Will renew a voucher!') },
                    onSuccess() { alert.success('Voucher updated!') },
                    onError() { alert.error('Error while renewing voucher!') }
                }
            );

            await addTokensToVoucher(
                sails,
                decodeAddress(signlessAccount.address),
                currentVoucherId,
                1, // adds one token
                2, // min tokens for voucher
                {
                    onLoad() { alert.info('Will add tokens to voucher') },
                    onSuccess() { alert.success('Tokens added to voucher!') },
                    onError() { alert.error('Error while adding tokens to voucher') }
                }
            )
        } catch(e) {
            alert.error('Error while updating signless account voucher');
            return;
        }

        try {
            const response = await sails.command(
                method,
                signlessAccount,
                {
                    voucherId: currentVoucherId,
                    callArguments: [ payload ],
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
            return;
        }
    }

    return (
        <div className='buttons-container'>
            <Button 
                isLoading={userFillingTheForm}
                onClick={async () => {
                    if (!signlessAccount) {
                        setUserFillingTheForm(true);
                        return;
                    }
                    
                    if (account) {
                        await sendMessageWithPayload(
                            'Ping/PingSignless',
                            account.decodedAddress
                        );
                    } else {
                        await sendMessageWithPayload(
                            'Ping/PingNoWallet',
                            noWalletSignlessAccountName
                        );
                    }
                }}
            >
                Send Ping with signless account
            </Button>
            <Button 
                isLoading={userFillingTheForm}
                onClick={async () => {
                    if (!signlessAccount) {
                        setUserFillingTheForm(true);
                        return;
                    }

                    if (account) {
                        await sendMessageWithPayload(
                            'Ping/PongSignless',
                            account.decodedAddress
                        );
                    } else {
                        await sendMessageWithPayload(
                            'Ping/PongNoWallet',
                            noWalletSignlessAccountName
                        );
                    }
                }}
            >
                Send Pong with signless account
            </Button>
            {
                userFillingTheForm && 
                <SignlessForm closeForm={() => {
                    setUserFillingTheForm(false);
                }}/>
            }
        </div>
    )
}
