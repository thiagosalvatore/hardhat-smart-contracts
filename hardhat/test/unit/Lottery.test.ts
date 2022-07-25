import { developmentChain, networkConfig } from "../../helper-hardhat-config";
import { deployments, ethers, getNamedAccounts, network } from "hardhat";
import { assert, expect } from "chai";
import config from "../../hardhat.config";
import { BigNumber, Contract } from "ethers";

!developmentChain.includes(network.config.chainId!)
    ? describe.skip
    : describe("Lottery", async () => {
          let lottery: Contract,
              vrfCoordinatorV2Mock: Contract,
              entranceFee: BigNumber,
              deployer: string,
              interval: string;

          const chainId = network.config.chainId;

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer;
              await deployments.fixture(["all"]);
              lottery = await ethers.getContract("Lottery", deployer);
              vrfCoordinatorV2Mock = await ethers.getContract(
                  "VRFCoordinatorV2Mock",
                  deployer
              );
              entranceFee = await lottery.getEntranceFee();
              interval = await lottery.getInterval();
          });

          describe("constructor", async () => {
              it("should initialize the lottery correctly", async () => {
                  const lotteryState = await lottery.getState();
                  const interval = await lottery.getInterval();

                  assert.equal(lotteryState.toString(), "0");
                  assert.equal(
                      interval.toString(),
                      networkConfig[chainId!]?.interval
                  );
              });
          });

          describe("enter lottery", async () => {
              it("should revert when you don't pay enough", async () => {
                  await expect(
                      lottery.enterLottery()
                  ).to.be.revertedWithCustomError(
                      lottery,
                      "Lottery_EntranceFeeTooLow"
                  );
              });

              it("should records player when they enter the lottery", async () => {
                  await lottery.enterLottery({ value: entranceFee });

                  const playerFromContract = await lottery.getPlayer(0);
                  assert.equal(playerFromContract, deployer);
              });

              it("should emit an event when a player enters the lottery", async () => {
                  await expect(
                      lottery.enterLottery({ value: entranceFee })
                  ).to.emit(lottery, "LotteryEntered");
              });

              it("should not allow entrance when lottery is not open", async () => {
                  await lottery.enterLottery({ value: entranceFee });
                  await network.provider.send("evm_increaseTime", [
                      parseInt(interval) + 1,
                  ]);
                  await network.provider.send("evm_mine", []);
                  await lottery.performUpkeep([]);

                  await expect(
                      lottery.enterLottery({ value: entranceFee })
                  ).to.be.revertedWithCustomError(
                      lottery,
                      "Lottery_LotteryNotOpen"
                  );
              });
          });

          describe("checkUpkeep", async () => {
              it("should return false when people didnt send ETH", async () => {
                  await network.provider.send("evm_increaseTime", [
                      parseInt(interval) + 1,
                  ]);
                  await network.provider.send("evm_mine", []);

                  const { upkeepNeeded } = await lottery.callStatic.checkUpkeep(
                      []
                  );

                  assert(!upkeepNeeded);
              });

              it("should return false if lottery is not open", async () => {
                  await lottery.enterLottery({ value: entranceFee });
                  await network.provider.send("evm_increaseTime", [
                      parseInt(interval) + 1,
                  ]);
                  await network.provider.send("evm_mine", []);
                  await lottery.performUpkeep("0x");

                  const { upkeepNeeded } = await lottery.callStatic.checkUpkeep(
                      []
                  );

                  assert.equal(upkeepNeeded, false);
              });

              it("should return false if enough time hasn't passed", async () => {
                  await lottery.enterLottery({ value: entranceFee });
                  await network.provider.send("evm_increaseTime", [
                      parseInt(interval) - 30,
                  ]);
                  await network.provider.send("evm_mine", []);

                  const { upkeepNeeded } = await lottery.callStatic.checkUpkeep(
                      []
                  );

                  assert.equal(upkeepNeeded, false);
              });

              it("should return true when lottery is open, enough time has passed, has players and has eth", async () => {
                  await lottery.enterLottery({ value: entranceFee });
                  await network.provider.send("evm_increaseTime", [
                      parseInt(interval) + 1,
                  ]);
                  await network.provider.send("evm_mine", []);

                  const { upkeepNeeded } = await lottery.callStatic.checkUpkeep(
                      []
                  );

                  assert.equal(upkeepNeeded, true);
              });
          });

          describe("performUpkeep", () => {
              it("should only run if checkUpkeep is true", async () => {
                  await lottery.enterLottery({ value: entranceFee });
                  await network.provider.send("evm_increaseTime", [
                      parseInt(interval) + 1,
                  ]);
                  await network.provider.send("evm_mine", []);

                  const tx = await lottery.performUpkeep([]);

                  assert(tx);
              });

              it("should update the lottery state to calculating when it runs", async () => {
                  await lottery.enterLottery({ value: entranceFee });
                  await network.provider.send("evm_increaseTime", [
                      parseInt(interval) + 1,
                  ]);
                  await network.provider.send("evm_mine", []);

                  await lottery.performUpkeep([]);

                  const state = await lottery.getState();
                  assert.equal(state.toString(), "1");
              });

              it("should revert when checkUpkeep is false", async () => {
                  await expect(
                      lottery.performUpkeep([])
                  ).to.be.revertedWithCustomError(
                      lottery,
                      "Lottery_UpkeepNotNeeded"
                  );
              });

              it("should emits an event when it is called", async () => {
                  await lottery.enterLottery({ value: entranceFee });
                  await network.provider.send("evm_increaseTime", [
                      parseInt(interval) + 1,
                  ]);
                  await network.provider.send("evm_mine", []);

                  await expect(lottery.performUpkeep([])).to.emit(
                      lottery,
                      "RequestedLotteryWinner"
                  );
              });
          });

          describe("fulfillRandomWords", () => {
              beforeEach(async () => {
                  await lottery.enterLottery({ value: entranceFee });
                  await network.provider.send("evm_increaseTime", [
                      parseInt(interval) + 1,
                  ]);
                  await network.provider.send("evm_mine", []);
              });

              it("should only succeed after performUpkeep", async () => {
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(
                          0,
                          lottery.address
                      )
                  ).to.be.revertedWith("nonexistent request");
              });

              it("picks a winner, resets the lottery and sends money", async () => {
                  const additionalEntrants = 3;
                  const startingAccountIndex = 1;
                  const accounts = await ethers.getSigners();
                  for (
                      let i = startingAccountIndex;
                      i < startingAccountIndex + additionalEntrants;
                      i++
                  ) {
                      const accountConnectedLottery = lottery.connect(
                          accounts[i]
                      );
                      await accountConnectedLottery.enterLottery({
                          value: entranceFee,
                      });
                  }
                  const startingTimeStamp = await lottery.getLatestTimestamp();

                  await new Promise<void>(async (resolve, reject) => {
                      lottery.once("WinnerPicked", async () => {
                          try {
                              const recentWinner =
                                  await lottery.getRecentWinner();
                              const state = await lottery.getState();
                              const endingTimestamp =
                                  await lottery.getLatestTimestamp();
                              const numberOfPlayers =
                                  await lottery.getNumberOfPlayers();
                              const winnerEndingBalance =
                                  await accounts[1].getBalance();

                              assert.equal(numberOfPlayers.toString(), "0");
                              assert.equal(state.toString(), "0");
                              assert(endingTimestamp > startingTimeStamp);
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance
                                      .add(
                                          entranceFee
                                              .mul(additionalEntrants)
                                              .add(entranceFee)
                                              .toString()
                                      )
                                      .toString()
                              );
                          } catch (e) {
                              reject(e);
                          }
                          resolve();
                      });
                      const tx = await lottery.performUpkeep([]);
                      const txReceipt = await tx.wait(1);
                      const winnerStartingBalance =
                          await accounts[1].getBalance();
                      await vrfCoordinatorV2Mock.fulfillRandomWords(
                          txReceipt.events[1].args.requestId,
                          lottery.address
                      );
                  });
              });
          });
      });
