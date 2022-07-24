import { ethers } from "ethers";

export interface FundMeState {
    connected: boolean;
    ethAmount: string;
    provider: ethers.providers.Web3Provider;
    currentBalance?: string | null;
}
