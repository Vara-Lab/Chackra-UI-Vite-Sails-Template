import { HexString, MessageSendOptions, ProgramMetadata, decodeAddress, GasInfo } from '@gear-js/api';
import { useApi } from '@gear-js/react-hooks';
import { AnyJson, AnyNumber, IKeyringPair, Signer } from '@polkadot/types/types';
import { web3FromSource } from '@polkadot/extension-dapp';

/**
 * custom hook for handling messages, reading status, etc.
 * @returns Functions to handle common actions in contracts
 */
 export const useContractUtils = () => {
    const { api } = useApi();

    /**
     * Function that sends a message using a user's voucher.
     * @param userAddress user address
     * @param voucherId voucher id that will be used to pay gas fees
     * @param userMetaSource Account meta source (account.meta.source)
     * @param programId Id of the contract affiliated with the voucher
     * @param programMetadata metadata of the contract to which the message will be sent
     * @param payload payload that will be sent to the contract
     * @param value tokens that are linked to the message
     * @param onSuccess optional callback for a successful transaction
     * @param onFail optional callback for a failed transaction
     * @param onInBlock optional callback for when the block hack has been created
     * @param onLoading callback for when the sending a message part is loaded
     * @returns void
     * @example
     * const payload = {
     *     PlayRound: null
     * };
     * 
     * await sendMessageWithVoucher(
     *     account.decodedAddress,
     *     voucherId,
     *     account.meta.source,
     *     programId,
     *     programPayloadString,
     *     payload,
     *     0, // value associated with the message
     *     () => { console.log('message send!'); },
     *     () => { console.log('Failed while sending message'); },
     *     null,
     *     () => { console.log('the message will be processed') }
     * );
     */
    const sendMessageWithVoucher = async (
        userAddress: HexString,
        voucherId: HexString,
        userMetaSource: string,
        programId: HexString,
        programMetadata: string,
        payload: any, 
        value: number,
        onSuccess?: () => void,
        onFail?: () => void,
        onInBlock?: () => void,
        onLoading?: () => void
    ): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            if (!api) {
                reject("Api is not started");
                return;
            }

            const currentProgramMetadata = ProgramMetadata.from(programMetadata);
    
            const totalGas = await api.program.calculateGas.handle(
                userAddress,
                programId,
                payload,
                value,
                false,
                currentProgramMetadata
            );
  
            console.log("Gas to spend: ", gasToSpend(totalGas));
  
            const { signer } = await web3FromSource(userMetaSource);
  
            const transferExtrinsic = api.message.send({
                destination: programId,
                payload,
                gasLimit: gasToSpend(totalGas),
                value,
                prepaid: true,
                account: userAddress
            }, currentProgramMetadata);
  
            const voucherTx = api.voucher.call(voucherId, { SendMessage: transferExtrinsic });
  
            try {
                await signMessage(
                    userAddress,
                    signer,
                    voucherTx,
                    onSuccess,
                    onFail,
                    onInBlock,
                    onLoading
                );
  
                resolve();
            } catch (e) {
                console.log("Error while sign transaction");
                reject("Error while sign transaction");
            }
            
        });
    }

    /**
     * Function that sends a message using a signless account
     * @param pair KeyringPair of the signless account
     * @param programId Id of the contract affiliated with the voucher
     * @param signlessVoucherId voucher id that will be used to pay gas fees
     * @param programMetadata metadata of the contract to which the message will be sent
     * @param payload payload that will be sent to the contract
     * @param value tokens that are linked to the message
     * @param onSuccess optional callback for a successful transaction
     * @param onFail optional callback for a failed transaction
     * @param onInBlock optional callback for when the block hack has been created
     * @param onLoading callback for when the sending a message part is loaded
     * @returns void
     * @example
     * const payload = {
     *     PlayRound: null
     * };
     * 
     * await sendMessageWithSignlessAccount(
     *     signlessAccount,
     *     programId,
     *     voucherIdOfSignlessAccount,
     *     programMetadataString,
     *     payload,
     *     0, // value associated with the message
     *     () => { console.log('message send!'); },
     *     () => { console.log('Failed while sending message'); },
     *     null,
     *     () => { console.log('the message will be processed') }
     * );
     */
    const sendMessageWithSignlessAccount = async ( 
        pair: IKeyringPair,
        programId: HexString,
        signlessVoucherId: HexString,
        programMetadata: string,
        payload: any, 
        value: AnyNumber,
        onSuccess?: () => void,
        onFail?: () => void,
        onInBlock?: () => void,
        onLoading?: () => void
    ): Promise<void> => {
        return new Promise(async (resolve, reject) => {
            if (!api) {
                reject("Api is not started");
                return;
            }
            
            const actualProgramMetadata = ProgramMetadata.from(programMetadata);
  
            const signlessDecodedAddress = decodeAddress(pair.address);
  
            const totalGas = await api.program.calculateGas.handle(
                signlessDecodedAddress,
                programId,
                payload,
                value,
                false,
                actualProgramMetadata
            );
  
            console.log("Gas to spend: ", gasToSpend(totalGas));
  
            const baseMessage: MessageSendOptions = {
                destination: programId,
                payload,
                gasLimit: gasToSpend(totalGas),
                value,
                prepaid: true,
            };
  
            const sendExtrinsic = api.message.send(baseMessage, actualProgramMetadata);
  
            const args = { SendMessage: sendExtrinsic };
  
            const extrinsic = api.specVersion >= 1100
                ? api.voucher.call(signlessVoucherId, args)
                : api.voucher.callDeprecated(args);
  
            try {
              await signMessageWithSignlessSession(
                pair,
                extrinsic,
                  
                onSuccess,
                onFail,
                onInBlock,
                onLoading
              )
              resolve();
            } catch (e) {
              console.log("Error while sign transaction");
              reject("Error while sign transaction");
            }
            
        });
    }
  
    /**
     * Function to send a message to a contract using an address
     * @param userAddress User address
     * @param userMetaSource Account meta source (account.meta.source)
     * @param programId Id of the contract to send the message
     * @param programMetadata metadata of the contract to which the message will be sent
     * @param payload payload that will be sent to the contract
     * @param value tokens that are linked to the message
     * @param onSuccess optional callback for a successful transaction
     * @param onFail optional callback for a failed transaction
     * @param onInBlock optional callback for when the block hack has been created
     * @param onLoading callback for when the sending a message part is loaded
     * @returns void
     * @example
     * const payload = {
     *     PlayRound: null
     * };
     * 
     * await sendMessage(
     *     accountAddress,
     *     account.meta.source,
     *     programId,
     *     programMetadataString,
     *     payload,
     *     0, // value associated with the message,
     *     () => { console.log('message send!'); },
     *     () => { console.log('Failed while sending message'); },
     *     null,
     *     () => { console.log('the message will be processed') }
     * );
     */
    const sendMessage = async (
        userAddress: HexString,
        userMetaSource: string,
        programId: HexString,
        programMetadata: string,
        payload: any, 
        value: AnyNumber,
        onSuccess?: () => void,
        onFail?: () => void,
        onInBlock?: () => void,
        onLoading?: () => void
    ): Promise<boolean> => {
        return new Promise(async (resolve, reject) => {
            if (!api) {
                reject("Api is not started");
                return;
            }
  
            const actualProgramMetadata = ProgramMetadata.from(programMetadata);
  
            const totalGas = await api.program.calculateGas.handle(
                userAddress,
                programId,
                payload,
                value,
                false,
                actualProgramMetadata
            );
  
            console.log("Gas to spend: ", gasToSpend(totalGas));
  
            const { signer } = await web3FromSource(userMetaSource);
  
            const transferExtrinsic = api.message.send({
                destination: programId,
                payload,
                gasLimit: gasToSpend(totalGas),
                value,
                prepaid: false,
                account: userAddress
            }, actualProgramMetadata);
  
            try {
                await signMessage(
                    userAddress,
                    signer,
                    transferExtrinsic,
                    onSuccess,
                    onFail,
                    onInBlock,
                    onLoading
                )
  
                resolve(true);
            } catch (e) {
                console.log("Error while sign transaction");
                reject("Error while sign transaction");
            }
            
        });
    }

    /**
     * Function to read the state of a contract from a payload
     * @param programId Id of contract to read state
     * @param programMetadata metadata of the contract to which the message will be sent
     * @param payload payload that will be sent to the contract
     * @returns An AnyJson with the contract state from the payload
     * @example
     * const contractState = await readState(
     *     programId,
     *     programMetadataString,
     *     {
     *         MatchPointsById: 1
     *     }
     * );
     * 
     * const { MatchPoints } = contractState;
     */
    const readState = async (
        programId: HexString, 
        programMetadata: string, 
        payload: any
    ): Promise<AnyJson> => {
        return new Promise(async (resolve, reject) => {
            if (!api) {
                reject("Api is not started");
                return;
            }

            const contractState = await api
                .programState
                .read(
                    {
                        programId,
                        payload
                    },
                    ProgramMetadata.from(programMetadata)
                );
  
            
            resolve(contractState.toJSON());
        });
    };

    /**
     * Function to sign an extrinsic from a KeyringPair of a signless account
     * @param pair KeyringPair to sign the extrinsic
     * @param extrinsic Extrinsic to sign
     * @param onSuccess optional callback for a successful transaction
     * @param onFail optional callback for a failed transaction
     * @param onInBlock optional callback for when the block hack has been created
     * @param onLoading callback for when the sending a message part is loaded
     * @returns void
     */
    const signMessageWithSignlessSession = async (
        pair: IKeyringPair,
        extrinsic: any,
        onSuccess?: () => void,
        onFail?: () => void,
        onInBlock?: () => void,
        onLoading?: () => void
      ): Promise<void> => {
        return new Promise(async (resolve, reject) => {
    
          let loadingMessageId = false;
        
          try {
            await extrinsic
            .signAndSend(
              pair,
              ({ status, events }: { status: any, events: any }) => {
                if (!loadingMessageId) {
                    if (onLoading) onLoading();
                    loadingMessageId = true;
                }
                if (status.isInBlock) {
                  console.log(
                    `Completed at block hash #${status.asInBlock.toString()}`
                  );
                  if (onInBlock) onInBlock();
                } else {
                  console.log(`Current status: ${status.type}`);
                  if (status.type === "Finalized") {
                    if (onSuccess) onSuccess();
                    resolve();
                  }
                }
              }
            )
          } catch(error: any) {
            console.log("transaction failed", error);
            if (onFail) onFail();
            reject("Error while sign transaction, or sending message");
          }
        });
    };

    /**
     * Function to sign an extrinsic with an user address
     * @param userAddress User address
     * @param signer signer from a user's meta source
     * @param extrinsic Extrinsic a firmar
     * @param onSuccess optional callback for a successful transaction
     * @param onFail optional callback for a failed transaction
     * @param onInBlock optional callback for when the block hack has been created
     * @param onLoading callback for when the sending a message part is loaded
     * @returns void
     */
    const signMessage = async (
        userAddress: HexString,
        signer: Signer,
        extrinsic: any,
        onSuccess?: () => void,
        onFail?: () => void,
        onInBlock?: () => void,
        onLoading?: () => void,
      ): Promise<void> => {
        return new Promise(async (resolve, reject) => {
          let onLoadMessageExecuted = false;
        
          try {
            await extrinsic
            .signAndSend(
              userAddress,
              { signer },
              ({ status, events }: { status: any, events: any }) => {
                if (!onLoadMessageExecuted) {
                    if (onLoading) onLoading();
                    onLoadMessageExecuted = true;
                }
                if (status.isInBlock) {
                  console.log(
                    `Completed at block hash #${status.asInBlock.toString()}`
                  );
                  if (onInBlock) onInBlock();
                } else {
                  console.log(`Current status: ${status.type}`);
                  if (status.type === "Finalized") {
                    console.log('Finalized');
                    if (onSuccess) onSuccess();
                    resolve();
                  }
                }
              }
            )
          } catch(error: any) {
            console.log("transaction failed", error);
            if (onFail) onFail();
            reject("Error while sign transaction, or sending message");
          }
        });
    };

    /**
     * Function to transform the gas information to be spent into a number
     * @param gasInfo information on the gas to be spent
     * @returns the amount of gas to be spent
     * @example
     * const totalGas = await api.program.calculateGas.handle(
     *     signlessDecodedAddress,
     *     programId,
     *     payload,
     *     0,
     *     false,
     *     programMetadata
     * );
     * 
     * console.log("Gas to spend: ", gasToSpend(totalGas));
     */
    const gasToSpend = (gasInfo: GasInfo): bigint => {
        const gasHuman = gasInfo.toHuman();
        const minLimit = gasHuman.min_limit?.toString() ?? "0";
        const parsedGas = Number(minLimit.replaceAll(',', ''));
        const gasPlusTenPorcent = Math.round(parsedGas + parsedGas * 0.10);
        const gasLimit: bigint = BigInt(gasPlusTenPorcent);
        return gasLimit;
    }
    
    return {
        sendMessageWithVoucher,
        sendMessageWithSignlessAccount,
        sendMessage,
        readState,
        signMessageWithSignlessSession,
        signMessage,
        gasToSpend
    };
}