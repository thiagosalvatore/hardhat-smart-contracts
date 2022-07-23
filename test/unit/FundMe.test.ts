import { deployments, ethers, getNamedAccounts } from "hardhat";
import { Contract } from "ethers";
import { Address } from "hardhat-deploy/dist/types";
import { assert, expect } from "chai";

describe("FundMe", async () => {
    let fundMe: Contract;
    let deployer: Address;
    let mockV3Aggregator: Contract;
    const sendValue = ethers.utils.parseEther("1");

    beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        fundMe = await ethers.getContract("FundMe", deployer);
        mockV3Aggregator = await ethers.getContract(
            "MockV3Aggregator",
            deployer
        );
    });

    describe("constructor", async () => {
        it("should set the aggregator addresses correctly", async function () {
            const response = await fundMe.getPriceFeed();

            assert.equal(response, mockV3Aggregator.address);
        });

        it("should set the owner as the deployer", async function () {
            const response = await fundMe.getOwner();

            assert.equal(response, deployer);
        });
    });

    describe("fund", async () => {
        it("should fail if you don't send enough ETH", async function () {
            await expect(fundMe.fund()).to.be.revertedWithCustomError(
                fundMe,
                "FundMe__NotEnoughEth"
            );
        });

        it("should update the amount funded data structure", async function () {
            await fundMe.fund({ value: sendValue });

            const response = await fundMe.getAddressToAmountFunded(deployer);
            assert.equal(response.toString(), sendValue.toString());
        });

        it("should add funder to array of funders", async function () {
            await fundMe.fund({ value: sendValue });

            const response = await fundMe.getFunder(0);

            assert.equal(response, deployer);
        });
    });

    describe("withdraw", async function () {
        beforeEach(async () => {
            await fundMe.fund({ value: sendValue });
        });

        it("should withdraw ETH from a single founder", async () => {
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );

            const transactionResponse = await fundMe.withdraw();
            const transactionReceipt = await transactionResponse.wait(1);
            const { gasUsed, effectiveGasPrice } = transactionReceipt;
            const totalGasCost = gasUsed.mul(effectiveGasPrice);
            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );

            assert.equal(endingFundMeBalance.toString(), "0");
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(totalGasCost).toString()
            );
        });

        it("should allow us to withdraw ETH from multiple founders", async () => {
            const accounts = await ethers.getSigners();
            for (const item of accounts) {
                const fundMeConnectedContract = await fundMe.connect(item);
                await fundMeConnectedContract.fund({ value: sendValue });
            }
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );

            const transactionResponse = await fundMe.withdraw();
            const transactionReceipt = await transactionResponse.wait(1);
            const { gasUsed, effectiveGasPrice } = transactionReceipt;
            const totalGasCost = gasUsed.mul(effectiveGasPrice);

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            );
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            );
            assert.equal(endingFundMeBalance.toString(), "0");
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(totalGasCost).toString()
            );
        });

        it("should restart all funders", async () => {
            const accounts = await ethers.getSigners();
            for (const item of accounts) {
                const fundMeConnectedContract = await fundMe.connect(item);
                await fundMeConnectedContract.fund({ value: sendValue });
            }

            await fundMe.withdraw();

            await expect(fundMe.getFunder(0)).to.be.reverted;
            for (const item of accounts) {
                assert.equal(
                    await fundMe.getAddressToAmountFunded(item.address),
                    0
                );
            }
        });

        it("should only allows the owner to withdraw", async () => {
            const accounts = await ethers.getSigners();
            const attacker = accounts[1];
            const attackerConnectedContract = await fundMe.connect(attacker);

            await expect(
                attackerConnectedContract.withdraw()
            ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
        });
    });
});
