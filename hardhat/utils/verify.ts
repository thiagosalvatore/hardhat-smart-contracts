import { run } from "hardhat";

export const verify = async (contractAddress: string, args: object) => {
    console.log("Verifying contract");

    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        });
    } catch (error) {
        // @ts-ignore
        if (error.message.toLowerCase().includes("already verified")) {
            console.log("Already verified");
        } else {
            console.log(error);
        }
    }
};
