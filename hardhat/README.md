# FundMe Hardhat Project

This is a simple project that implements a basic structure for a Smart Contract used for CrowdFunding. This contract allows people to fund the contract (minimum value of $ 50) and allows the owner to withdraw from the contract. It also has unit and integration tests, as well as support for rinkeby and goerly chains for testing purposes.

## Useful Commands

- Run unit tests: `yarn test`
- Run integration tests on rinkeby network: `yarn test:integration`
- Run lint using solhint: `yarn lint`
- Reformat the code with Prettier: `yarn format`
- Run tests with coverage: `yarn coverage`

If you want to enable the gas-report, you just need to update the `hardhat.config.ts` and set `gasReporter.enabled` to `true`.