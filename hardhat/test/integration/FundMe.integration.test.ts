import { ethers, getNamedAccounts, network } from "hardhat";
import { Contract } from "ethers";
import { Address } from "hardhat-deploy/dist/types";
import { assert } from "chai";
import { developmentChain } from "../../helper-hardhat-config";

developmentChain.includes(network.config.chainId!)
    ? describe.skip
    : describe("FundMe", async () => {
          let fundMe: Contract;
          let deployer: Address;
          const sendValue = ethers.utils.parseEther("0.2");

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer;
              fundMe = await ethers.getContract("FundMe", deployer);
          });

          it("should allow people to fund and withdraw", async function () {
              await fundMe.fund({ value: sendValue });
              await fundMe.withdraw();

              const endingBalance = await fundMe.provider.getBalance(
                  fundMe.address
              );
              assert.equal(endingBalance.toString(), "0");
          });
      });
