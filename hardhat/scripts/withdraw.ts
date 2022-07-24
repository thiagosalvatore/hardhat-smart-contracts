import { ethers, getNamedAccounts } from "hardhat";

async function main() {
    const { deployer } = await getNamedAccounts();
    const fundMe = await ethers.getContract("FundMe", deployer);
    console.log("Withdrawing Contract");
    const transactionResponse = await fundMe.withdraw();
    await transactionResponse.wait(1);
    const balance = await fundMe.provider.getBalance(deployer);
    console.log("Withdraw complete, balance is now", balance.toString());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });
