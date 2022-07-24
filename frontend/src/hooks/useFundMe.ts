import { FundMeState } from "@/states/FundMeState";
import { ethers } from "ethers";
import { FormEvent, useState } from "react";
import { fundMe } from "../shared/abis/fund-me";

const initialState: FundMeState = {
    connected: false,
    ethAmount: "0",
    provider: new ethers.providers.Web3Provider(window.ethereum),
    currentBalance: null,
};

export const useFundMe = () => {
    const [state, setState] = useState<FundMeState>(initialState);

    const getBalance = async (): Promise<string> => {
        const balance = await state.provider.getBalance(
            process.env.REACT_APP_FUNDME_CONTRACT_ADDRESS!
        );
        const formattedBalance = ethers.utils.formatEther(balance);
        setState((prevState) => ({
            ...prevState,
            currentBalance: formattedBalance,
        }));
        return formattedBalance;
    };

    const connectMetamaskAccount = async () => {
        await state.provider.send("eth_requestAccounts", []);
        setState((prevState) => ({
            ...prevState,
            connected: true,
        }));
    };

    const fund = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const signer = state.provider.getSigner();
        const contract = new ethers.Contract(
            process.env.REACT_APP_FUNDME_CONTRACT_ADDRESS!,
            fundMe,
            signer
        );
        try {
            const transactionResponse = await contract.fund({
                value: ethers.utils.parseEther(state.ethAmount),
            });
            await listenForTransactionMine(
                transactionResponse,
                state.provider!
            );
            setState((prevState) => ({ ...prevState, ethAmount: "0" }));
        } catch (error) {
            console.log(error);
        }
    };

    const withdraw = async () => {
        const signer = state.provider?.getSigner();
        const contract = new ethers.Contract(
            process.env.REACT_APP_FUNDME_CONTRACT_ADDRESS!,
            fundMe,
            signer
        );
        try {
            const transactionResponse = await contract.withdraw();
            await listenForTransactionMine(
                transactionResponse,
                state.provider!
            );
            await getBalance();
        } catch (error) {
            console.log(error);
        }
    };

    const listenForTransactionMine = async (
        transactionResponse: ethers.providers.TransactionResponse,
        provider: ethers.providers.Web3Provider
    ): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            provider.once(
                transactionResponse.hash,
                (transactionReceipt: ethers.providers.TransactionReceipt) => {
                    console.log(
                        `Complete with ${transactionReceipt.confirmations}`
                    );
                    resolve();
                }
            );
        });
    };

    const updateEthAmount = (amount: string) => {
        setState({
            ...state,
            ethAmount: amount,
        });
    };

    return {
        state,
        fund,
        connectMetamaskAccount,
        withdraw,
        getBalance,
        updateEthAmount,
    };
};
