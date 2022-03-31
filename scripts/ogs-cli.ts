import { OGSPPool__factory } from "./../typechain-types/factories/OGSPPool__factory";
import { ERC20__factory } from "./../typechain-types/factories/ERC20__factory";
import { ERC20 } from "./../typechain-types/ERC20";
import { OGSDPP } from "./../typechain-types/OGSDPP";
import { OGSPPool } from "./../typechain-types/OGSPPool";
import { EACAggregatorProxyMock } from "./../typechain-types/EACAggregatorProxyMock";

import { EACAggregatorProxyMock__factory } from "./../typechain-types/factories/EACAggregatorProxyMock__factory";
import inquirer from "inquirer";
import { ethers } from "hardhat";
import Big from "big.js";

import { DODODppProxy__factory } from "./../typechain-types/factories/DODODppProxy__factory";
import { DODODppProxy } from "./../typechain-types/DODODppProxy";
import { DODOV2Proxy02__factory } from "./../typechain-types/factories/DODOV2Proxy02__factory";
import { DPPFactory__factory } from "./../typechain-types/factories/DPPFactory__factory";
import { OGSDPP__factory } from "./../typechain-types/factories/OGSDPP__factory";
import { isNil } from "lodash";

type InquirerQuestion = { type: string; name: string; message: string };
type MatchResult<T> = { value?: T; matched: boolean };

type OGSContext = {
  base: ERC20;
  quote: ERC20;
  eacProxyMock: EACAggregatorProxyMock;
  ogsDPP: OGSDPP;
  ogsPPool: OGSPPool;
};
type OGSDeployResult = {
  gtonToken: string;
  usdcToken: string;
  eacProxyMock: string;
  feeRateModel: string;
  ogsPPool: string;
  ogsDPP: string;
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
      "swapViaOGS: swapViaOGS gton usdc 100",
      // "swapViaDODO: swapViaDODO (gton/usdc|gton/wftm) 100",
      "writePegPrice: writePegPrice (gton/usdc|gton/wftm) 1.5 - basically, I param",
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

    switch (spl[0]) {
      case "writePegPrice":
        const pegPrice = new Big(spl[1]).mul(Math.pow(10, 6)).toFixed();

        console.log(`peg: ${pegPrice}`);
        console.log(
          `write peg price success. check tx: ${(
            await this.ogs_context.eacProxyMock.mockUpdatePrice(pegPrice)
          ).hash.toString()}`
        );
        return { matched: true };
      case "swapViaOGS":
        const tokens: Record<string, string> = {
          gton: this.deployResult.gtonToken.toString(),
          usdc: this.deployResult.usdcToken.toString(),
        };
        const swapAmount = spl[3];

        console.log("args", [
          this.ogs_context.ogsPPool.address,
          tokens[spl[1]],
          tokens[spl[2]],
          new Big(swapAmount).mul(1e18).toFixed(),
          deployer.address,
          true,
        ]);

        await this.ogs_context.base
          .attach(tokens[spl[1]])
          .approve(
            this.ogs_context.ogsDPP.address,
            new Big(swapAmount).mul(1e18).toFixed()
          );

        // await this.ogs_context.base.transfer(
        //   this.ogs_context.ogsPPool.address,
        //   new Big(100_000).mul(1e18).toFixed()
        // );
        // await this.ogs_context.quote.transfer(
        //   this.ogs_context.ogsPPool.address,
        //   new Big(100_000).mul(1e18).toFixed()
        // );

        console.log(
          `swap via ogs executed successfully. check tx: ${(
            await this.ogs_context.ogsDPP.swapPrivatePool(
              this.ogs_context.ogsPPool.address,
              tokens[spl[1]],
              tokens[spl[2]],
              new Big(swapAmount).mul(1e18).toFixed(),
              deployer.address,
              true
            )
          ).hash.toString()}`
        );
        return { matched: true };
      // case "swapViaOGS":
      //   console.log("swap via ogs executed successfully");
      //   return { matched: true };
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
    // ogsDPP: (await ethers.getContractFactory("OGSDPP")) as EACAggregatorProxyMock,
    // dodoV2: (await ethers.getContractFactory(
    //   "DODOV2Proxy02"
    // )) as DODOV2Proxy02__factory,
    // dppFactory: (await ethers.getContractFactory(
    //   "DPPFactory"
    // )) as DPPFactory__factory,
    // dodoDppProxy: (await ethers.getContractFactory(
    //   "DODODppProxy"
    // )) as DODODppProxy__factory,
    eacProxyMock: (await ethers.getContractFactory(
      "EACAggregatorProxyMock"
    )) as EACAggregatorProxyMock__factory,
    erc20: (await ethers.getContractFactory(
      "contracts/ERC20/WrappedNative.sol:ERC20"
    )) as ERC20__factory,
  };

  const deployResult = {
    gtonToken: "0x43709bd555EA3ECdD0f9ab0EB1dB70df81a5DB64",
    usdcToken: "0xC3FE9a4A055fa37858174a141F299f60BB169b3F",
    eacProxyMock: "0x623364AE9dcAB479Da91a17904b6f32696BF3108",
    feeRateModel: "0x75527eE36420cAC506e5F820Ccb3Ba9199e0236c",
    ogsPPool: "0xa801c29d88923f45d45D285F792B762F908CF36F",
    ogsDPP: "0x3052A604a14e79157D7A3A728A409516650eABe9",
  };

  const builtContracts = {
    base: factories.erc20.attach(deployResult.gtonToken),
    quote: factories.erc20.attach(deployResult.usdcToken),
    eacProxyMock: factories.eacProxyMock.attach(deployResult.eacProxyMock),
    ogsDPP: factories.ogsDPP.attach(deployResult.ogsDPP),
    ogsPPool: factories.ogsPPool.attach(deployResult.ogsPPool),
  };
  const questionsHandler = new QuestionsHandler(builtContracts, deployResult);

  const questions = questionsHandler.allAvailableQuestions();

  const process_input = async () => {
    inquirer.prompt(questions).then(async (answer) => {
      const matchResult = await questionsHandler.matchCommand(answer.welcome);
      // console.log({ matchResult });

      await process_input();
    });
  };

  await process_input();
}

start();
