import { useEffect, useState } from 'react'
import {
    useContractUtils,
} from '@/app/hooks';
import { useContext } from 'react';
import { dAppContext } from '@/Context/dappContext';
import {  Button } from '@gear-js/vara-ui';
import { CONTRACT } from '@/app/consts';
import { useAccount } from '@gear-js/react-hooks';
import { 
    NormalButtons,
    VoucherButtons,
    SignlessButtons,
} from '@/components/ExampleComponents';
import './Examples.css';

export const Examples = () => {
    const { account } = useAccount();
    const { 
        currentVoucherId,
        setCurrentVoucherId,
        setSignlessAccount
    } = useContext(dAppContext);
    const {
        readState
    } = useContractUtils();

    const [pageSignlessMode, setPageSignlessMode] = useState(false);
    const [voucherModeInPolkadotAccount, setVoucherModeInPolkadotAccount] = useState(false);
    const [contractState, setContractState] = useState("");

    useEffect(() => {
        if (!account) {
            setPageSignlessMode(true);
        } else {
            setPageSignlessMode(false);
        }
        if (setCurrentVoucherId) setCurrentVoucherId(null)
    }, [account])

    return (
        <div className='examples-container'>
            
            <div className='examples'>
                <div className='information'>
                    <p>
                        signless mode: { pageSignlessMode ? "Activated" : "disabled" }
                    </p>
                    <p>
                        voucher active: { currentVoucherId ? "true" : "false" }
                    </p>
                    <p
                        style={{
                            maxWidth: "300px"
                        }}
                    >
                        state: {contractState}
                    </p>
                </div>
                <Button onClick={async () => {
                    const contractState: any = await readState(
                        CONTRACT.programId,
                        CONTRACT.metadata,
                        {
                            LastWhoCallContract: null
                        }
                    );

                    setContractState(JSON.stringify(contractState));

                }}>
                    Read State
                </Button>
                <Button onClick={() => {
                    if (setCurrentVoucherId) setCurrentVoucherId(null);
                    if (setSignlessAccount) setSignlessAccount(null);
                    setPageSignlessMode(!pageSignlessMode);

                }}>
                    toggle signless mode
                </Button>
                {
                    !pageSignlessMode && (
                        <Button onClick={() => {
                            setVoucherModeInPolkadotAccount(!voucherModeInPolkadotAccount);
                        }}>
                            toggle voucher mode
                        </Button>
                    )
                }

                {
                    !pageSignlessMode && !voucherModeInPolkadotAccount && (
                        <NormalButtons />
                    )
                }

                {
                    pageSignlessMode && <SignlessButtons />
                }

                {
                    !pageSignlessMode && voucherModeInPolkadotAccount && (
                        <VoucherButtons />
                    )
                }
            </div>
        </div>
    );
}
