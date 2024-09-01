import React, { useContext } from 'react'
import { Button } from '@/components/ui/button';
import { useAccount, useAlert } from '@gear-js/react-hooks';
import { dAppContext } from '@/Context/dappContext';
import { HexString } from '@gear-js/api';
import { useSailsCalls } from '@/app/hooks';
import { renewVoucher, addTokensToVoucher, vouchersIdOfAddress } from '@/app/utils';
import { web3FromSource } from '@polkadot/extension-dapp';
import '../ButtonsContainer.css';


export const VoucherButtons = () => {
    const { account } = useAccount();
    const { 
        currentVoucherId,
        setCurrentVoucherId
    } = useContext(dAppContext);

    const sails = useSailsCalls();
    const alert = useAlert();

    const manageVoucherId = async (voucherId: HexString): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            if (!account || !sails) {
                alert.error('Account or sails is not ready');
                reject('Account or sails is not ready');
                return;
            }

            try {
                await renewVoucher(
                    sails,
                    account.decodedAddress,
                    voucherId,
                    1_200, // 1200 blocks (an hour)
                    {
                        onLoad() { alert.info('Will renew the voucher') },
                        onSuccess() { alert.success('Voucher was renewed!') },
                        onError() { alert.error('Error while renewing voucher') }
                    }
                );

                await addTokensToVoucher(
                    sails,
                    account.decodedAddress,
                    voucherId,
                    1, // Adds one token
                    2, // Min num of tokens
                    {
                        onLoad() { alert.info('Will add tokens to voucher') },
                        onSuccess() { alert.success('Tokens added to voucher!') },
                        onError() { alert.error('Error while adding tokens to voucher!') }
                    }
                )

                resolve();
            } catch (e) {
                alert.error('Error while check voucher');
                reject(e);
            }
        });
    }

    return (
        <div className='buttons-container'>
            <Button onClick={async () => {
                if (!account || !sails) {
                    alert.error("Accounts or sails not ready!");
                    return;
                }

                let voucherIdToUse;

                if (!currentVoucherId) {
                    const vouchersForAddress = await vouchersIdOfAddress(
                        sails,
                        account.decodedAddress
                    );

                    if (vouchersForAddress.length === 0) {
                        voucherIdToUse = await sails.createVoucher(
                            account.decodedAddress,
                            3,
                            1_200,
                            {
                                onLoad() { alert.info('Will create a voucher!') },
                                onSuccess() { alert.success("Voucher created!") },
                                onError() { alert.error('Error while creating voucher') }
                            }
                        );
                    } else {
                        voucherIdToUse = vouchersForAddress[0];

                        if (setCurrentVoucherId) setCurrentVoucherId(voucherIdToUse);
                        
                        await manageVoucherId(voucherIdToUse);
                    }
                } else {
                    await manageVoucherId(currentVoucherId);
                    voucherIdToUse = currentVoucherId;
                }

                const { signer } = await web3FromSource(account.meta.source);

                try {
                    const response = await sails.command(
                        'Ping/Ping',
                        {
                            userAddress: account.decodedAddress,
                            signer
                        },
                        {
                            voucherId: voucherIdToUse,
                            callbacks: {
                                onLoad() { alert.info('Will send a message with voucher') },
                                onSuccess() { alert.success('Message send with voucher!') },
                                onBlock(blockHash) { alert.info(`Message in block: ${blockHash}`) },
                                onError() { alert.error('Failed while sending message with voucher') }
                            }
                        }
                    )

                    console.log(`Response: ${Object.keys(response)[0]}`);
                } catch (e) {
                    alert.error('Error while sending message');
                }
            }}>
                Send Ping with voucher
            </Button>
            <Button onClick={async () => {
                if (!account || !sails) {
                    alert.error("Accounts or sails not ready!");
                    return;
                }

                let voucherIdToUse;
                
                if (!currentVoucherId) {
                    const vouchersForAddress = await vouchersIdOfAddress(
                        sails,
                        account.decodedAddress
                    );

                    if (vouchersForAddress.length === 0) {
                        voucherIdToUse = await sails.createVoucher(
                            account.decodedAddress,
                            3, // Num of tokens
                            1_200, // 1200 blocks (an hour)
                            {
                                onLoad() { alert.info('Will create a voucher!') },
                                onSuccess() { alert.success("Voucher created!") },
                                onError() { alert.error('Error while creating voucher') }
                            }
                        );
                    } else {
                        voucherIdToUse = vouchersForAddress[0];

                        if (setCurrentVoucherId) setCurrentVoucherId(voucherIdToUse);

                        await manageVoucherId(voucherIdToUse);
                    }
                } else {
                    await manageVoucherId(currentVoucherId);
                    voucherIdToUse = currentVoucherId;
                }

                const { signer } = await web3FromSource(account.meta.source);

                try {
                    const response = await sails.command(
                        'Ping/Pong',
                        {
                            userAddress: account.decodedAddress,
                            signer
                        },
                        {
                            voucherId: voucherIdToUse,
                            callbacks: {
                                onLoad() { alert.info('Will send a message with voucher') },
                                onSuccess() { alert.success('Message send with voucher!') },
                                onBlock(blockHash) { alert.info(`Message in block: ${blockHash}`) },
                                onError() { alert.error('Failed while sending message with voucher') }
                            }
                        }
                    )

                    console.log(`Response: ${Object.keys(response)[0]}`);
                } catch (e) {
                    alert.error('Error while sending message');
                }
            }}>
                Send Pong with voucher
            </Button>
        </div>
    )
}
