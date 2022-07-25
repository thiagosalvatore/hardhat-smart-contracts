import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers, network } from "hardhat";
import { developmentChain, networkConfig } from "../helper-hardhat-config";
import { verify } from "../utils/verify";

const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("2");

module.exports = async ({
    getNamedAccounts,
    deployments,
}: HardhatRuntimeEnvironment) => {
    const { deploy, log } = deployments;
    const { deployer, player } = await getNamedAccounts();
    const chainId = network.config.chainId;

    // when going for localhost or hardhat network we want to use a mock
    let vrfCoordinatorV2Address, subscriptionId;
    if (developmentChain.includes(chainId!)) {
        const vrfCoordinatorV2 = await ethers.getContract(
            "VRFCoordinatorV2Mock"
        );
        vrfCoordinatorV2Address = vrfCoordinatorV2.address;
        const transactionResponse = await vrfCoordinatorV2.createSubscription();
        const transactionReceipt = await transactionResponse.wait(1);
        subscriptionId = transactionReceipt.events[0].args.subId;
        await vrfCoordinatorV2.fundSubscription(
            subscriptionId,
            VRF_SUB_FUND_AMOUNT
        );
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId!]?.vrfCoordinatorV2;
        subscriptionId = networkConfig[chainId!]?.subscriptionId;
    }
    const args = [
        vrfCoordinatorV2Address,
        networkConfig[chainId!]?.entranceFee,
        networkConfig[chainId!]?.gasLane,
        subscriptionId,
        networkConfig[chainId!]?.callbackGasLimit,
        networkConfig[chainId!]?.interval,
    ];
    const lottery = await deploy("Lottery", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: networkConfig[chainId!]?.blockConfirmations || 1,
    });

    if (!developmentChain.includes(chainId!) && process.env.ETHERSCAN_API_KEY) {
        await verify(lottery.address, args);
    }

    log("-------------------------------");
};

module.exports.tags = ["all", "lottery"];
