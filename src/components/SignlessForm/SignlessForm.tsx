import { useState, useEffect } from 'react'
import { useDAppContext } from '@/Context/dappContext'
import { useSailsCalls } from '@/app/hooks';
import { useForm } from 'react-hook-form'
import { Input, Button, Modal } from '@gear-js/vara-ui';
import { useAccount, useAlert } from '@gear-js/react-hooks';
import { decodeAddress, HexString } from '@gear-js/api';
import { renewVoucher, addTokensToVoucher } from '@/app/utils';
import CryptoJs from 'crypto-js';
import './SignlessForm.css';


interface Props {
    closeForm: any
}

interface FormDefaultValuesI {
    accountName: string,
    password: string
}

const DEFAULT_VALUES: FormDefaultValuesI = {
    accountName: '',
    password: ''
};


// For fast update, you can change this values
const MIN_AMOUNT_OF_BLOCKS = 2; // min amount of blocks for vouchers
const TOKENS_TO_ADD_TO_VOUCHER = 1; // tokens to add to voucher
const BLOCKS_TO_RENEW_VOUCHER = 1_200; // blocks to renew voucher if is expired (one hour)
const INITIAL_VOUCHER_TOKENS = 2; // Initial tokens for new vouchers
const INITIAL_BLOCKS_FOR_VOUCHER = 1_200; // Initial blocks for voucher (one hour)



export const SignlessForm = ({ closeForm }: Props) => {
    const sails = useSailsCalls();
    const alert = useAlert();

    const { account } = useAccount();
    const { register, handleSubmit, formState } = useForm({ defaultValues: DEFAULT_VALUES });
    const { errors } = formState;
    const { register: register2, handleSubmit: handleSubmit2, formState: formState2 } = useForm({ defaultValues: DEFAULT_VALUES });
    const { errors: errors2 } = formState2;
    
    const {
        setSignlessAccount,
        setCurrentVoucherId,
        setNoWalletSignlessAccountName
    } = useDAppContext();
    
    const [loadingAnAction, setLoadingAnAction] = useState(false);
    const [userHasWallet, setUserHasWallet] = useState(false);
    const [sectionConfirmCreationOfSignlessAccountIsOpen, setsectionConfirmCreationOfSignlessAccountIsOpen] = useState(false);
    const [noWalletAccountData, setNoWalletAccountData] = useState<FormDefaultValuesI>({ 
        accountName: '', 
        password: '',
    });

    useEffect(() => {
        if (!account) {
            setUserHasWallet(false);
        } else {
            setUserHasWallet(true);
        }
    }, [account]);


    const handleConfirmData = async () => {
        if (!sails) {
            console.error('SailsCalls is not started')
            return;
        }

        setLoadingAnAction(true);

        const encryptedName = CryptoJs.SHA256(noWalletAccountData.accountName).toString();
        const newSignlessAccount = await sails.createNewKeyringPair(
            noWalletAccountData.accountName
        );
        const lockedSignlessAccount = sails.lockkeyringPair(
            newSignlessAccount,
            noWalletAccountData.password
        );
        const formatedLockedSignlessAccount = sails.modifyPairToContract(lockedSignlessAccount);
  
        let signlessVoucherId;

        try {
            signlessVoucherId = await sails.createVoucher(
                decodeAddress(newSignlessAccount.address),
                INITIAL_VOUCHER_TOKENS, 
                INITIAL_BLOCKS_FOR_VOUCHER,
                {
                    onLoad() { alert.info('Issue voucher to signless account...') },
                    onSuccess() { alert.success('Voucher created for signless account!') },
                    onError() { alert.error('Error while issue voucher to signless account') }
                }
            );

            setCurrentVoucherId(signlessVoucherId);
        } catch(e) {
            alert.error('Error while issue a voucher to a singless account!');
            setLoadingAnAction(false);
            return;
        }

        try {
            await sails.command(
                'KeyringService/BindKeyringDataToUserCodedName',
                newSignlessAccount,
                {
                    voucherId: signlessVoucherId,
                    callArguments: [
                        encryptedName,
                        formatedLockedSignlessAccount
                    ],
                    callbacks: {
                        onLoad() { alert.info('Will send a message') },
                        onSuccess() { alert.success('Signless account send!') },
                        onBlock(blockHash) { alert.info(`Message is in block: ${blockHash}`) },
                        onError() { alert.error('Error while sending singless account') }
                    }
                }
            );
        } catch(e) {
            alert.error('Error while sending signless account');
            setLoadingAnAction(false);
            return;
        }

        setSignlessAccount(newSignlessAccount);
        setCurrentVoucherId(signlessVoucherId);
        setNoWalletSignlessAccountName(encryptedName);
        setLoadingAnAction(false);
        closeForm();
    };

    const handleSubmitPassword = async ({ password }: FormDefaultValuesI) => {
        if (!account || !sails) {
            alert.error('Account or SailsCalls is not ready');
            return;
        }

        setLoadingAnAction(true);

        const contractState: any = await sails.query(
            'KeyringService/KeyringAddressFromUserAddress',
            {
                callArguments: [
                    account.decodedAddress
                ]
            }
        );

        const { signlessAccountAddress } = contractState;

        if (signlessAccountAddress) {
            const contractState = await sails.query(
                'KeyringService/KeyringAccountData',
                {
                    callArguments: [
                        signlessAccountAddress
                    ]
                }
            );

            const { signlessAccountData } = contractState;

            let signlessDataFromContract;

            try {
                const lockedSignlessAccount = sails.formatContractSignlessData(
                    signlessAccountData,
                    'signlessPair'
                );
                signlessDataFromContract = sails.unlockKeyringPair(
                    lockedSignlessAccount,
                    password
                );
            } catch(e) {
                alert.error('Incorrect password for signless account!');
                setLoadingAnAction(false);
                return;
            }

            const vouchersId = await sails.vouchersInContract(
                decodeAddress(signlessDataFromContract.address)
            );

            try {
                await checkUpdatesForVoucher(
                    decodeAddress(signlessDataFromContract.address),
                    vouchersId[0]
                );
                
            } catch(e) {
                alert.error('Error while updating signless account voucher');
                setLoadingAnAction(false);
                return;
            } 

            setSignlessAccount(signlessDataFromContract);
            setCurrentVoucherId(vouchersId[0]);
            setLoadingAnAction(false);
            closeForm();
            return;
        }

        // Signless account does not exists

        const newSignlessAccount = await sails.createNewKeyringPair();
        const lockedSignlessAccount = sails.lockkeyringPair(
            newSignlessAccount,
            password
        );
        const formatedLockedSignlessAccount = sails.modifyPairToContract(
            lockedSignlessAccount
        );

        let signlessVoucherId;

        try {
            signlessVoucherId = await sails.createVoucher(
                decodeAddress(newSignlessAccount.address),
                INITIAL_VOUCHER_TOKENS, // initial tokens
                INITIAL_BLOCKS_FOR_VOUCHER, // 30 blocks (one minute)
                {
                    onLoad() { alert.info('Issue voucher to signless account...') },
                    onSuccess() { alert.success('Voucher created for signless account!') },
                    onError() { alert.error('Error while issue voucher to signless account') }
                }
            );

            setCurrentVoucherId(signlessVoucherId);
        } catch(e) {
            alert.error('Error while issue a voucher to a singless account!');
            setLoadingAnAction(false);
            return;
        }

        try {
            await sails.command(
                'KeyringService/BindKeyringDataToUserAddress',
                newSignlessAccount,
                {
                    voucherId: signlessVoucherId,
                    callArguments: [
                        account.decodedAddress,
                        formatedLockedSignlessAccount
                    ],
                    callbacks: {
                        onLoad() { alert.info('Will send a message') },
                        onSuccess() { alert.success('Signless account send!') },
                        onBlock(blockHash) { alert.info(`Message in block: ${blockHash}`) },
                        onError() { alert.error('Error while sending signless account') }
                    }
                }
            );
        } catch(e) {
            alert.error('Error while sending signless account');
            setLoadingAnAction(false);
            return;
        }

        setSignlessAccount(newSignlessAccount);
        setCurrentVoucherId(signlessVoucherId);

        setLoadingAnAction(false);
        closeForm();
    }

    const handleSubmitNoWalletSignless = async ({accountName, password}: FormDefaultValuesI) => {
        if (!sails) {
            alert.error('SailsCalls is not ready');
            return;
        }

        setLoadingAnAction(true);

        const encryptedName = CryptoJs.SHA256(accountName).toString();

        let contractState: any = await sails.query(
            'KeyringService/KeyringAddressFromUserCodedName',
            {
                callArguments: [
                    encryptedName
                ]
            }
        );

        const { signlessAccountAddress } = contractState;

        if (!signlessAccountAddress) {
            setsectionConfirmCreationOfSignlessAccountIsOpen(true);
            setLoadingAnAction(false);
            return;
        }

        contractState = await sails.query(
            'KeyringService/KeyringAccountData',
            {
                callArguments: [
                    signlessAccountAddress
                ]
            }
        );

        const { signlessAccountData } = contractState;

        let signlessDataFromContract;

        try {
            const lockedSignlessData = sails.formatContractSignlessData(
                signlessAccountData,
                accountName
            );

            signlessDataFromContract = sails.unlockKeyringPair(
                lockedSignlessData,
                password
            );
        } catch(e) {
            alert.error('Incorrect password for signless account!');
            console.error(e);
            setLoadingAnAction(false);
            return;
        }
        const decodedSignlessAddress = decodeAddress(signlessDataFromContract.address);
        const vouchersId = await sails.vouchersInContract(
            decodedSignlessAddress
        );

        await checkUpdatesForVoucher(
            decodedSignlessAddress,
            vouchersId[0]
        );

        setSignlessAccount(signlessDataFromContract);
        setCurrentVoucherId(vouchersId[0]);
        setNoWalletSignlessAccountName(encryptedName);
        setLoadingAnAction(false);
        closeForm();
    };

    const checkUpdatesForVoucher = (address: HexString, voucherId: HexString): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            if (!sails) {
                alert.error();
                reject('SailsCalls is not started');
                return;
            }

            try {
                await renewVoucher(
                    sails,
                    address,
                    voucherId,
                    BLOCKS_TO_RENEW_VOUCHER, // Amout of blocks (one hour)
                    {
                        onLoad() { alert.info('Will renew the voucher') },
                        onSuccess() { alert.success('Voucher renewed!') },
                        onError() { alert.error('Error while renewing voucher') }
                    }
                );
    
                await addTokensToVoucher(
                    sails,
                    address,
                    voucherId,
                    TOKENS_TO_ADD_TO_VOUCHER,
                    MIN_AMOUNT_OF_BLOCKS,
                    {
                        onLoad() { alert.info('Will add tokens to voucher') },
                        onSuccess() { alert.success('Tokens added to voucher') },
                        onError() { alert.error('Error while adding tokens to voucher') }
                    }
                );
                resolve();
            } catch(e) {
                alert.error('Error while updating signless account voucher');
                reject(e);
                return;
            } 
        });
    }

    const formWithWallet = () => {
        return (
            <form onSubmit={handleSubmit2(handleSubmitPassword)} className='signless-form--form'>
                <Input 
                    className='signless-form__input'
                    type='password'
                    label='Set password'
                    error={errors2.password?.message}
                    {
                        ...register2(
                            'password',
                            {
                                required: 'Field is required',
                                minLength: {
                                    value: 10,
                                    message: 'Minimum length is 10'
                                }
                            }
                        )
                    }
                />
                <Button
                    className='signless-form__button'
                    type='submit'
                    block={true}
                    isLoading={loadingAnAction}
                >
                    Submit
                </Button>
                {
                    !sectionConfirmCreationOfSignlessAccountIsOpen &&  <Button
                        className='signless-form__button'
                        color='light'
                        block={true}
                        onClick={closeForm}
                        isLoading={loadingAnAction}
                    >
                        Cancel
                    </Button>
                }
            </form>
        );
    }

    const formWithoutWallet = () => {
        return (
            <form 
                onSubmit={
                    handleSubmit(
                        !sectionConfirmCreationOfSignlessAccountIsOpen
                        ? handleSubmitNoWalletSignless
                        : handleConfirmData
                    )
                } 
                className='signless-form--form'
            >
                {
                    !sectionConfirmCreationOfSignlessAccountIsOpen && <>
                        <Input 
                            className='signless-form__input'
                            type='account name'
                            label='Set name'
                            error={errors.password?.message}
                            {
                                ...register(
                                    'accountName',
                                    {
                                        required: 'Field is required',
                                        minLength: {
                                            value: 10,
                                            message: 'Minimum length is 10'
                                        }
                                    }
                                )
                            }
                            onChange={(e) => {
                                setNoWalletAccountData({
                                    ...noWalletAccountData,
                                    accountName: e.target.value
                                });
                            }}
                            value={noWalletAccountData.accountName}
                        />
                        <Input 
                            className='signless-form__input'
                            type='password'
                            label='Set password'
                            error={errors.password?.message}
                            {
                                ...register(
                                    'password',
                                    {
                                        required: 'Field is required',
                                        minLength: {
                                            value: 10,
                                            message: 'Minimum length is 10'
                                        }
                                    }
                                )
                            }
                            onChange={(e) => {
                                setNoWalletAccountData({
                                    ...noWalletAccountData,
                                    password: e.target.value
                                });
                            }}
                            value={noWalletAccountData.password}
                        />
                    </>
                }

                {
                    sectionConfirmCreationOfSignlessAccountIsOpen &&
                    <p 
                        style={{
                            width: '280px',
                            textAlign: 'center',
                            marginBottom: '10px'
                        }}
                    >
                        The account does not have a signless account, do you want to create one?
                    </p>
                }
                
                <Button 
                    className='signless-form__button'
                    type='submit'
                    block={true}
                    isLoading={loadingAnAction}
                >
                    {
                        !sectionConfirmCreationOfSignlessAccountIsOpen
                        ? 'Submit'
                        : "Create"
                    }
                </Button>

                {
                    sectionConfirmCreationOfSignlessAccountIsOpen &&  <Button
                        className='signless-form__button'
                        color='grey'
                        block={true}
                        onClick={() => setsectionConfirmCreationOfSignlessAccountIsOpen(false)}
                        isLoading={loadingAnAction}
                    >
                        Cancel
                    </Button>
                }
                {
                    !sectionConfirmCreationOfSignlessAccountIsOpen &&  <Button
                        className='signless-form__button'
                        color='grey'
                        block={true}
                        onClick={closeForm}
                        isLoading={loadingAnAction}
                    >
                        Cancel
                    </Button>
                }
            </form>
        );
    }

    return <Modal
            heading='Signless Form'
            close={
                !loadingAnAction
                 ? closeForm
                 : () => console.log('Cant close modal while an action is active!')
            }
        >
            <div className='signless-form'>
                { userHasWallet ? formWithWallet() : formWithoutWallet() }   
            </div>
        </Modal>
}

