import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "hardhat-abi-exporter";
import "@nomiclabs/hardhat-etherscan";

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
export default {
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    ftm: {
      // url: "https://rpc.ankr.com/fantom",
      url: "https://rpcapi-tracing.fantom.network",
      accounts: process.env.PK ? [process.env.PK] : undefined,
    },
    goerli: {
      timeout: 60000,
      url: "https://rpc.goerli.mudit.blog/",
      accounts: process.env.TESTNET_PK ? [process.env.TESTNET_PK] : undefined,
    },
    ftmtestnet: {
      // gas: 5000000,
      // url: "https://rpc.ankr.com/fantom",
      url: "https://rpc.testnet.fantom.network",
      accounts: process.env.TESTNET_PK ? [process.env.TESTNET_PK] : undefined,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.7",
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
        },
      },
      {
        version: "0.8.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
        },
      },
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
        },
      },
      {
        version: "0.6.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
        },
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
        },
      },
      {
        version: "0.6.9",
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
        },
      },
      {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
        },
      },
    ],
  },
  abiExporter: {
    clear: true,
    flat: true,
    spacing: 2,
  },
  mocha: {
    timeout: "100000000000000",
  },
  etherscan: {
    apiKey: {
      opera: "PYTF1XH3ND5KGGQCKREIQEZQ8X2M8R12SP",
    },
  },
};
