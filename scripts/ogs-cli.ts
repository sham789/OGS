import { FreeToken__factory } from "./../typechain-types/factories/FreeToken__factory";
import { FreeToken } from "./../typechain-types/FreeToken";
import { OGSPPool__factory } from "./../typechain-types/factories/OGSPPool__factory";

import { OGSDPP } from "./../typechain-types/OGSDPP";
import { OGSPPool } from "./../typechain-types/OGSPPool";
import { EACAggregatorProxyMock } from "./../typechain-types/EACAggregatorProxyMock";

import { EACAggregatorProxyMock__factory } from "./../typechain-types/factories/EACAggregatorProxyMock__factory";
import inquirer from "inquirer";
import { ethers } from "hardhat";
import Big from "big.js";

import { OGSDPP__factory } from "./../typechain-types/factories/OGSDPP__factory";
import { isNil } from "lodash";

type InquirerQuestion = { type: string; name: string; message: string };
type MatchResult<T> = { value?: T; matched: boolean };

type OGSContext = {
  base: FreeToken;
  quote: FreeToken;
  eacProxyMock?: EACAggregatorProxyMock;
  ogsDPP: OGSDPP;
  ogsPPool: OGSPPool;
};
type OGSDeployResult = {
  gtonToken: string;
  usdcToken: string;
  eacProxyMock?: string;
  poolAddr: string;
};

class QuestionsHandler {
  private ogs_context: OGSContext;
  private deployResult: OGSDeployResult;

  constructor(ogs_context: OGSContext, deployResult: OGSDeployResult) {
    this.ogs_context = ogs_context;
    this.deployResult = deployResult;
  }

  welcome(): InquirerQuestion {
    const commands = [
      "swapViaOGS: swapViaOGS (gton|usdc) (gton|usdc) 100",
      "faucet: faucet (gton|usdc) 100",
    ].join("\n");

    return {
      type: "input",
      name: "welcome",
      message: `input the operation, available ones: \n${commands}\n`,
    };
  }

  swapGTONtoUSDCQuestion(): InquirerQuestion {
    return {
      type: "input",
      name: "swapGTONtoUSDCQuestion",
      message: `input the operation, available ones: `,
    };
  }

  allAvailableQuestions(): InquirerQuestion[] {
    return [this.welcome()];
  }

  async matchCommand<T>(command: string): Promise<MatchResult<T>> {
    console.log({ command });
    if (isNil(command)) {
      return { matched: false };
    }
    const [deployer] = await ethers.getSigners();

    const spl = command.split(" ");

    const tokens: Record<string, string> = {
      gton: this.deployResult.gtonToken.toString(),
      usdc: this.deployResult.usdcToken.toString(),
    };
    const tokensToERC20: Record<string, FreeToken> = {
      gton: this.ogs_context.base.attach(tokens.gton),
      usdc: this.ogs_context.base.attach(tokens.usdc),
    };

    switch (spl[0]) {
      case "faucet":
        const faucetAmount = spl[2];
        // console.log({ spl, faucetAmount });
        const faucetAmountBig = new Big(faucetAmount).mul(1e18).toFixed();
        console.log({ spl, faucetAmountBig: faucetAmountBig });

        console.log(
          `swap via ogs executed successfully. check tx: ${(
            await tokensToERC20[spl[1]].freeMint(
              deployer.address,
              faucetAmountBig
            )
          ).hash.toString()}`
        );
        return { matched: true };
      case "swapViaOGS":
        const swapAmount = spl[3];

        await tokensToERC20[spl[1]].approve(
          this.ogs_context.ogsDPP.address,
          new Big(swapAmount).mul(1e18).toFixed()
        );

        console.log(
          `swap via ogs executed successfully. check tx: ${(
            await this.ogs_context.ogsDPP.swapPrivatePool(
              this.deployResult.poolAddr,
              tokens[spl[1]],
              tokens[spl[2]],
              new Big(swapAmount).mul(1e18).toFixed(),
              deployer.address,
              true
            )
          ).hash.toString()}`
        );
        return { matched: true };
      default:
        return { matched: false };
    }
  }
}
async function start() {
  const factories = {
    ogsDPP: (await ethers.getContractFactory("OGSDPP")) as OGSDPP__factory,
    ogsPPool: (await ethers.getContractFactory(
      "OGSPPool"
    )) as OGSPPool__factory,
    eacProxyMock: (await ethers.getContractFactory(
      "EACAggregatorProxyMock"
    )) as EACAggregatorProxyMock__factory,
    erc20: (await ethers.getContractFactory("FreeToken")) as FreeToken__factory,
  };

  const deployResult = {
    resp: {
      multicall: "0x1a0B462Cacc0e8473a27567fbd3e87d9e5c9B2d0",
      dodoSellHelper: "0x3DB6BAE65fEA1a1bc9F16672D84cE0A24c9026b5",
      dodoSwapHelper: "0xB51eC5D0a4234ea85484024acb71AB500342E1DD",
      erc20helper: "0x87eDCFBd4006bddA59e131EEA84f477565460516",
      dodoCalleeHelper: "0xEaE55Eb6CAb5E722908FD9671e90917E4F5aB536",
      dodoV1PmmHelper: "0xF6a642098C0384b6B47Ea93A0846b0D3CA861263",
      feeRateModel: "0xD7a416875C4cffa085348F239cf265e49B7A95CA",
      userQuota: "0x47322caF0666338f6761E72702f0D1ab1a8728C1",
      feeRateImpl: "0x1a121a9c2a799d1899E55c83A97e58a0762117e5",
      permissionManager: "0x19cd56ecce550f10771572904f06de68af83cf9d",
      dvmTemplate: "0xe1eb2e069ccbAb1Fe9E0945e6f655d25D992aC93",
      dspTemplate: "0xCD32608b93CCdC613328E979D5673f7Fa539DF38",
      dppTemplate: "0x44b3c0c42Bb7fD2096542FB697821ADdFE547b90",
      dppAdminTemplate: "0x37afc07b38b07EE3c486eB45189b59379D7934b6",
      cpTemplate: "0x74b18851BBe02A03157857a4aE888E8383F5967C",
      erc20initializable: "0x9C12C0d2D2197D04F17c56a69D4E7c6Af54ce73D",
      erc20Mine: "0x007d1b7E73225d971c1ea8012f69F3bE78FA70c8",
      erc20MineV3: "0xB52a63FB9cFce294E1Cf0f0bcd92d416104e675b",
      dodoApprove: "0xd57d3517e05e35ba7c91A94e57ae3cAD223d373B",
      dodoApproveProxy: "0xa70cdd654A7ceC87FF2aCb9AB3620CAD295402B1",
      erc20V2Factory: "0x8C8854D83567c6010dab57e742e8E8158706464c",
      dvmFactory: "0x6104539c46352f6E698FFb8D795C7BacB03aD8b1",
      dppFactory: "0xD8215f0E58F268EFc914DD2ed7E0Ed4CBf993576",
      upCrowdPoolingFactory: "0x11fA71C6AA7d0FB1BCCFbCD395aeAb65B71FC854",
      crowdPoolingFactory: "0x03Ed113dD785b631163A9DE0437b7B1437525876",
      dspFactory: "0xd63A1Ff53da9f48DFF475bfe3D233Edc87C6Ed0A",
      dodoMineV2Factory: "0x3710DfDC267370A435255eCC9ce0a3091dD86eC4",
      dodoMineV3RegistryFactory: "0xe5C0C08a086688CF3aD79b378A31554E2a5e4F6E",
      dodoV2Helper: "0x224D77494118212e8019dCf9f30FfeeA9016dBD1",
      dodoV1Adapter: "0x11AE20B15773C80f6E32e6d5974e108f5Cb420ea",
      dodoV2Adapter: "0xA4bF5d4b0915090b64617F1456dd7Cf11D36eDbc",
      uniAdapter: "0x386E24C7C4dDadf5E37C1bB92427fC3F95b966a4",
      dodoV2Proxy02: "0x67fDA50Fba0CB8A95eC19F83920164a6C3Bee11c",
      dodoDspProxy: "0x4897B4Db94C22778351af29AA5A0cCdfD50Fe0b2",
      dodoCpProxy: "0x61e344c605f10A9B3caC8b7E0B5d6A7d40Df1379",
      dodoDppProxy: "0x470Ea663d4e9B4fc644122c629c95AE71C81dEe0",
      dodoMineV3Proxy: "0xBd1579Bf8697479AE42F1918f198D7A3C521F371",
      dodoRouteProxy: "0xDF05E6c6885952a08c5497BC3C32E1EE25Db382C",
    },
    OGSDPP: "0x1a0Dcb6814af30D6743841a6F425792e644E16bF",
    poolAddr: "0xe1276DC6bc744f063d6f05Dc4C8ec1bD7C61b2cB",
    poolAddrList: ["0xe1276DC6bc744f063d6f05Dc4C8ec1bD7C61b2cB"],
    gtonToken: "0xD04B30F9b223547035C9BC5F1dD700995cA0aBa3",
    usdcToken: "0x7312a3112e4048F33d69A5C6BbA20CD5E688Edd7",
  };

  const builtContracts = {
    base: factories.erc20.attach(deployResult.gtonToken),
    quote: factories.erc20.attach(deployResult.usdcToken),
    ogsDPP: factories.ogsDPP.attach(deployResult.OGSDPP),
    ogsPPool: factories.ogsPPool.attach(deployResult.poolAddr),
  };
  const questionsHandler = new QuestionsHandler(builtContracts, deployResult);

  const questions = questionsHandler.allAvailableQuestions();

  const process_input = async () => {
    inquirer.prompt(questions).then(async (answer) => {
      const matchResult = await questionsHandler.matchCommand(answer.welcome);

      await process_input();
    });
  };

  await process_input();
}

start();
