import {
    GearKeyring,
    IUpdateVoucherParams,
    HexString
} from '@gear-js/api';
import {
    useApi,
    useBalanceFormat
} from '@gear-js/react-hooks';



export const useVoucherUtils = (sponsorName: string, sponsorMnemonic: string) => {
    const { api } = useApi();
    const { seed } = GearKeyring.generateSeed(sponsorMnemonic);
    const { getFormattedBalanceValue } = useBalanceFormat();

    /**
     * Value of a Token in Vara Network
     */
    const ONE_TVARA_VALUE = 1000000000000;


    /**
     * function that automatically manages the status of the voucher and updates it as necessary
     * @param address address affiliated with the voucher
     * @param voucherId voucher id affiliated with the address
     * @param tokensToAdd number of tokens to add to the voucher
     * @param newExpirationTimeInBlocks number of blocks to update the expitation time of the voucher
     * @param minBalance Minimum balance that the voucher must have
     * @param onSuccess optional callback for a successful transaction
     * @param onFail optional callback for a failed transaction
     * @param onLoading optional callback for when the sending a message part is loaded
     * @returns void
     * @example
     * const voucherId = '0xfsf...';
     * 
     * await checkVoucherForUpdates(
     *     addressAffiliated,
     *     voucherId,
     *     4, // 4 Tokens to add
     *     1_200, // An hour in blocks
     *     2 // min balance for the voucher
     * );
     */
    const checkVoucherForUpdates = async (
      address: HexString,
      voucherId: HexString, 
      tokensToAdd: number,
      newExpirationTimeInBlocks: number,
      minBalance: number = 2,
      onSuccess?: () => void,
      onFail?: () => void,
      onLoading?: () => void,
    ): Promise<void> => {
      return new Promise(async (resolve, reject) => {
        if (await voucherExpired(voucherId, address)) {
          await renewVoucherInBlocks(
            voucherId, 
            address, 
            newExpirationTimeInBlocks,
            onSuccess,
            onFail,
            onLoading
          )
        }

        const totalBalanceOfVoucher = await voucherBalance(voucherId);

        if (totalBalanceOfVoucher < minBalance) {
          await addTokensToVoucher(
            voucherId,
            address,
            tokensToAdd,
            onSuccess,
            onFail,
            onLoading
          );
        }

        resolve();
      })
    }

    /** 
     * Function to generate a new voucher from an address of a user and a contract
     * @param programsId id of the contracts to affiliate the voucher
     * @param address address to which the voucher will be assigned
     * @param initialTokensInVoucher Initial voucher tokens (greater than or equal to 2)
     * @param initialExpiredTimeInBlocks Expiration time in blocks
     * @param onSuccess optional callback for a successful transaction
     * @param onFail optional callback for a failed transaction
     * @param onLoading optional callback for when the sending a message part is loaded
     * @returns the id of the generated voucher
     * @example
     * const voucherId = await generateNewVoucher(
     *     [programId],
     *     account.decodedAddress,
     *     5,  // Five tokens 
     *     1_200, // Expiration of one hour
     *     () => { console.log('Action success!'); },
     *     null,
     *     () => { console.log('Action is loading'); }
     * );
     */
    const generateNewVoucher = (
        programsId: HexString[], 
        address: HexString,
        initialTokensInVoucher: number,
        initialExpiredTimeInBlocks: number,
        onSuccess?: () => void,
        onFail?: () => void,
        onLoading?: () => void,
    ): Promise<HexString> => {
        return new Promise(async (resolve, reject) => {
          if (!api) {
            reject('Error creating new voucher');
            return;
          }

          if (initialTokensInVoucher < 2) {
            reject('Min limit of initial tokens is 2');
            return;
          }

          if (initialExpiredTimeInBlocks < 20) {
            reject('Min limit of blocks is 20');
            return;
          }
    
          const voucherIssued = await api.voucher.issue(
            address,
            ONE_TVARA_VALUE * initialTokensInVoucher, 
            initialExpiredTimeInBlocks, // An hour in blocks
            programsId,
          );
    
          try {
            await signTransaction(
                voucherIssued.extrinsic, 
                onSuccess,
                onFail,
                onLoading
              );
            resolve(voucherIssued.voucherId);
          } catch (e) {
            console.log("Error processing transaction");
            reject("Error while sign transaction");
          }
        });
    };

    /**
     * Obtain all vouchers from an account in a contract
     * @param programId id of the contract to obtain the id vouchers
     * @param userAddress address of the user to obtain the id vouchers
     * @returns Id of the vouchers affiliated with the contract and the user's address
     * @example
     * const allVouchersId = await vouchersInContract(
     *     programId,
     *     account.decodedAddress
     * );
     * 
     * if (allVouchersId.length > 0) {
     *     // Prints first voucher Id 
     *     console.log(allVouchersId[0]); 
     * }
     */
    const vouchersInContract = async (
        programId: HexString, 
        userAddress: HexString
    ): Promise<HexString[]> => {
        return new Promise(async (resolve, reject) => {
          if (!api) {
            reject('api or account is not ready');
            return;
          }
    
          const vouchersData = await api.voucher.getAllForAccount(userAddress, programId);
          const vouchersId = Object.keys(vouchersData);

          resolve(vouchersId as HexString[]);
        });
    };

    /**
     * Function to know if an address has vouchers affiliated with a contract
     * @param programId contract id
     * @param userAddress user address
     * @returns boolean value that indicates if they have vouchers affiliated with a contract
     * @example
     * const hasVouchersInContract = await addressHasVouchersInContract(
     *     programId,
     *     account.decodedAddress
     * );
     * 
     * if (hasVouchersInContract) {
     *     console.log('address has vouchers in contract');
     * } else {
     *     console.log('Without vouchers in contract');
     * }
     */
    const addressHasVouchersInContract = async (
      programId: HexString, 
      userAddress: HexString
    ): Promise<boolean> => {
        return new Promise(async (resolve, reject) => {
          if (!api) {
            reject('api is not ready');
            return;
          }
    
          const vouchers = await api.voucher.getAllForAccount(userAddress, programId);
    
          resolve(Object.keys(vouchers).length > 0);
        });
    };

    /**
     * Function to know if a voucher has expired
     * @param voucherId voucher id to check
     * @param userAddress address associated with the voucher
     * @returns Boolean value to know if voucher expired
     * @example
     * const expired = await voucherExpired(
     *     voucherId,
     *     account.decodedAddress
     * );
     * 
     * if (expired) {
     *     console.log('Voucher expired!');
     * }
     */
    const voucherExpired = async (
      voucherId: HexString, 
      userAddress: HexString
    ): Promise<boolean> => {
        return new Promise(async (resolve, reject) => {
            if (!api) {
                reject('Api is not ready!');
                return;
            }

            const voucherData = await api.voucher.getDetails(userAddress, voucherId);
            const blockHash = await api.blocks.getFinalizedHead();
            const blocks = await api.blocks.getBlockNumber(blockHash as Uint8Array);

            resolve(blocks.toNumber() > voucherData.expiry);
        });
    };

    /**
     * Function to obtain the balance of a voucher
     * @param voucherId voucher id
     * @returns Balance of the voucher
     * @example
     * const balance = await voucherBalance(
     *    voucherId
     * );
     * 
     * console.log(`The balance of the voucher is: ${balance}`);
     */
    const voucherBalance = async (voucherId: string): Promise<number> => {
        return new Promise(async (resolve, reject) => {
            if (!api) {
                reject('api or account is not ready');
                return;
            }

            const voucherBalance = await api.balance.findOut(voucherId);
            const voucherBalanceFormated = Number(
                getFormattedBalanceValue(voucherBalance.toString()).toFixed()
            );

            resolve(voucherBalanceFormated);
        });
    };

    /**
     * Function to renew the voucher a certain number of blocks
     * @param voucherId voucher id to renew 
     * @param useAddress address affiliated with the voucher
     * @param numOfBlocks number of blocks (min 20)
     * @param onSuccess optional callback for a successful transaction
     * @param onFail optional callback for a failed transaction
     * @param onLoading optional callback when the sending a message part is loaded
     * @returns void
     * @example
     * if (voucherExpired) {
     *     await renewVoucherInBlocks(
     *         voucherId,
     *         account.decodedAddress,
     *         1_200, // Renew voucher for one hour
     *         () => { console.log('Voucher renewed!'); },
     *         () => { console.log('Action fail!'); }
     *         () => { console.log('Operation is loading'); }
     *     );
     * }
     */
    const renewVoucherInBlocks = async (
        voucherId: string, 
        useAddress: HexString,
        numOfBlocks: number,
        onSuccess?: () => void,
        onFail?: () => void,
        onLoading?: () => void,
    ): Promise<void> => {
        return new Promise(async (resolve, reject) => {
          if (!api) {
            reject('Api or Account is not ready');
            return;
          }

          if (numOfBlocks < 20) {
            reject('Minimum block quantity is 20!');
            return;
          }
    
          const newVoucherData: IUpdateVoucherParams = {
            prolongDuration: 1_200, // one hour
          };
    
          const voucherUpdate = api.voucher.update(useAddress, voucherId, newVoucherData);
    
          try {
            await signTransaction(
                voucherUpdate,
                onSuccess,
                onFail,
                onLoading
            );
            resolve();
          } catch (e) {
            console.log("Error during sign transaction");
            reject("Error while sign transaction");
          }
        });
    };

    /**
     * Function to add tokens to a voucher
     * @param voucherId voucher id to add the tokens
     * @param userAddress address associated with the voucher id
     * @param numOfTokens Num of tokens to add to the voucher
     * @param onSuccess optional callback for a successful transaction
     * @param onFail optional callback for a failed transaction
     * @param onLoading optional callback when the sending a message part is loaded
     * @returns void
     * @example
     * if (tokensInVoucher < 2) {
     *     await addTokensToVoucher(
     *         voucherId,
     *         account.decodedAddress,
     *         7, // Adding 7 tokens to voucher
     *         () => { console.log('Tokens added to voucher!') },
     *         () => { console.log('Fail while adding tokens'); },
     *         () => { console.log('Actions will start'); }
     *     );
     * }
     */
    const addTokensToVoucher = async (
        voucherId: string, 
        userAddress: HexString,
        numOfTokens: number,
        onSuccess?: () => void,
        onFail?: () => void,
        onLoading?: () => void,
    ): Promise<void> => {
        return new Promise(async (resolve, reject) => {
          if (!api) {
            console.log('Api or Account is not ready');
            reject(false);
            return;
          }

          if (numOfTokens < 0) {
            reject('Cant assign negative tokens!');
            return;
          }
    
          const newVoucherData: IUpdateVoucherParams = {
            balanceTopUp: ONE_TVARA_VALUE * numOfTokens
          };
    
          const voucherUpdate = api.voucher.update(userAddress, voucherId, newVoucherData);
    
          try {
            await signTransaction(
                voucherUpdate,
                onSuccess,
                onFail,
                onLoading
            )
            resolve();
          } catch (e) {
            console.log("Error while sign transaction");
            reject("Error while sign transaction");
          }
        });
    };

    /**
     * function that will sign the function, belongs to the hook itself
     * @param extrinsic Extrinsic to sign
     * @param onSuccess optional callback for a successful transaction
     * @param onFail optional callback for a failed transaction
     * @param onLoading optional callback when the sending a message part is loaded
     * @returns void
     */
    const signTransaction = async (
        extrinsic: any,
        onSuccess?: () => void,
        onFail?: () => void,
        onLoading?: () => void,
    ): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            const keyring = await GearKeyring.fromSeed(seed, sponsorName);
        
            try {
                if (onLoading) onLoading();

                await extrinsic.signAndSend(keyring, async (event: any) => {
                    console.log(event.toHuman());
                    const extrinsicJSON: any = event.toHuman();
                    if (extrinsicJSON && extrinsicJSON.status !== 'Ready') {
                    const objectKey = Object.keys(extrinsicJSON.status)[0];
                    if (objectKey === 'Finalized') {
                        if (onSuccess) onSuccess();
                        console.log('Finalized');
                        resolve();
                    }
                    }
                });
            } catch (error: any) {
                if (onFail) onFail(); 
                console.error(`${error.name}: ${error.message}`);
                reject(false);
            }
        });
    }

    return {
      checkVoucherForUpdates,
      generateNewVoucher,
      vouchersInContract,
      addressHasVouchersInContract,
      voucherExpired,
      voucherBalance,
      renewVoucherInBlocks,
      addTokensToVoucher
    };
}