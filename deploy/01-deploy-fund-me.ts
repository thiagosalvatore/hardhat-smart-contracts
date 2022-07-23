import { HardhatRuntimeEnvironment } from "hardhat/types";
import { network } from "hardhat";
import { developmentChain, networkConfig } from "../helper-hardhat-config";
import { verify } from "../utils/verify";

module.exports = async ({
    getNamedAccounts,
    deployments,
}: HardhatRuntimeEnvironment) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    // when going for localhost or hardhat network we want to use a mock
    let ethUsdPriceFeedAddress;
    if (developmentChain.includes(chainId!)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId!]?.ethUsdPriceFeed;
    }
    const args = [ethUsdPriceFeedAddress];
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: networkConfig[chainId!]?.blockConfirmations || 1,
    });

    // if (!developmentChain.includes(chainId!) && process.env.ETHERSCAN_API_KEY) {
    //     await verify(fundMe.address, args);
    // }

    log("-------------------------------");
};

module.exports.tags = ["all", "fund-me"];
