require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      accounts: {
        count: 20,
        accountsBalance: "100000000000000000000000" // 100,000 ETH in wei
      }
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: {
        count: 20,
        accountsBalance: "100000000000000000000000" // 100,000 ETH in wei
      }
    }
  }
};