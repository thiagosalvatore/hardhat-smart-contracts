export const chainIdMapping = {
    rinkeby: 4,
    hardhat: 31337,
    localhost: 31337,
};

export const developmentChain = [
    chainIdMapping.hardhat,
    chainIdMapping.localhost,
];

export const networkConfig = {
    [chainIdMapping.rinkeby]: {
        name: "rinkeby",
        ethUsdPriceFeed: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
        blockConfirmations: 6,
    },
    [chainIdMapping.hardhat]: {
        name: "hardhat",
        blockConfirmations: 1,
    },
    [chainIdMapping.localhost]: {
        name: "hardhat",
        blockConfirmations: 1,
    },
};
