import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers, network } from "hardhat";
import { developmentChain } from "../helper-hardhat-config";

const DECIMALS = 8;
const INITIAL_ANSWER = 200000000000;
const BASE_FEE = ethers.utils.parseEther("0.25"); // 0.25 is the premium cost. It costs 0.25 LINK per request
const GAS_PRICE_LINK = 1e9; // calculated value based on the gas price of the chain.

module.exports = async ({
    getNamedAccounts,
    deployments,
}: HardhatRuntimeEnvironment) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    if (developmentChain.includes(chainId!)) {
        log("Local network detected, deploying mocks");
        await deploy("MockV3Aggregator", {
            from: deployer,
            args: [DECIMALS, INITIAL_ANSWER],
            log: true,
        });
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            args: [BASE_FEE, GAS_PRICE_LINK],
            log: true,
        });
        log("Mocks deployed");
        log("-----------------------------");
    }
};
module.exports.tags = ["all", "mocks"];
