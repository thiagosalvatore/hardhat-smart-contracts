import { ethers, getNamedAccounts, network } from "hardhat";
import { BigNumber, Contract } from "ethers";
import { developmentChain } from "../../helper-hardhat-config";
import { assert, expect } from "chai";

developmentChain.includes(network.config.chainId!)
    ? describe.skip
    : describe("Lottery", async () => {
          let lottery: Contract, entranceFee: BigNumber, deployer: string;

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer;
              lottery = await ethers.getContract("Lottery", deployer);
              entranceFee = await lottery.getEntranceFee();
          });

          describe("fullfillRandomWords", () => {
              it("picks a winner, resets the lottery and sends money", async () => {
                  const startingTimeStamp = await lottery.getLatestTimestamp();
                  const accounts = await ethers.getSigners();

                  await new Promise<void>(async (resolve, reject) => {
                      lottery.once("WinnerPicked", async () => {
                          try {
                              const recentWinner =
                                  await lottery.getRecentWinner();
                              const state = await lottery.getState();
                              const endingTimestamp =
                                  await lottery.getLatestTimestamp();
                              const winnerEndingBalance =
                                  await accounts[0].getBalance();

                              await expect(lottery.getPlayer(0)).to.be.reverted;
                              assert.equal(
                                  recentWinner.toString(),
                                  accounts[0].address
                              );
                              assert.equal(state.toString(), "0");
                              assert(endingTimestamp > startingTimeStamp);
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance
                                      .add(entranceFee)
                                      .toString()
                              );
                          } catch (e) {
                              reject(e);
                          }
                          resolve();
                      });

                      const tx = await lottery.enterLottery({
                          value: entranceFee
                      });
                      await tx.wait(1);
                      const winnerStartingBalance =
                          await accounts[0].getBalance();
                  });
              });
          });
      });
