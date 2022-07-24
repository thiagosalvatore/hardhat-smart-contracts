import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-etherscan";
import "dotenv/config";
import "hardhat-gas-reporter";
import "hardhat-deploy";
import "solidity-coverage";

const config: HardhatUserConfig = {
    solidity: {
        compilers: [{ version: "0.8.9" }, { version: "0.6.6" }],
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY,
    },
    networks: {
        goerly: {
            url: process.env.GOERLY_RPC_URL,
            accounts: [process.env.GOERLY_PRIVATE_KEY!],
            chainId: 5,
        },
        rinkeby: {
            url: process.env.RINKEBY_RPC_URL,
            accounts: [process.env.RINKEBY_PRIVATE_KEY!],
            chainId: 4,
        },
    },
    gasReporter: {
        enabled: false,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    },
    namedAccounts: {
        deployer: {
            default: 0, // index of the account in the list of accounts for each network. We can use the key as the chainId to have different indexes for different chains
        },
    },
};

export default config;
