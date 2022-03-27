import { EACAggregatorProxyMock__factory } from "./../typechain-types/factories/EACAggregatorProxyMock__factory";
import inquirer from "inquirer";
import { ethers } from "hardhat";

import { DODODppProxy__factory } from "./../typechain-types/factories/DODODppProxy__factory";
import { DODODppProxy } from "./../typechain-types/DODODppProxy";
import { DODOV2Proxy02__factory } from "./../typechain-types/factories/DODOV2Proxy02__factory";
import { DPPFactory__factory } from "./../typechain-types/factories/DPPFactory__factory";
import { OGSDPP__factory } from "./../typechain-types/factories/OGSDPP__factory";
import { isNil } from "lodash";

type InquirerQuestion = { type: string; name: string; message: string };
type MatchResult<T> = { value?: T; matched: boolean };

class QuestionsHandler {
  welcome(): InquirerQuestion {
    const commands = [
      "swapViaOGS: swapViaOGS (gton/usdc|gton/wftm) 100",
      "swapViaDODO: swapViaDODO (gton/usdc|gton/wftm) 100",
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

  matchCommand<T>(command: string): MatchResult<T> {
    console.log({ command });
    if (isNil(command)) {
      return { matched: false };
    }

    const spl = command.split(" ");

    switch (spl[0]) {
      case "writePegPrice":
        console.log("write peg price success");
        return { matched: true };
      case "swapViaDODO":
        console.log("swap via dodo executed successfully");
        return { matched: true };
      case "swapViaOGS":
        console.log("swap via ogs executed successfully");
        return { matched: true };
      default:
        return { matched: false };
    }
  }
}

const questionsHandler = new QuestionsHandler();

const questions = questionsHandler.allAvailableQuestions();

async function start() {
  const factories = {
    ogsDPP: (await ethers.getContractFactory("OGSDPP")) as OGSDPP__factory,
    // ogsDPP: (await ethers.getContractFactory("OGSDPP")) as EACAggregatorProxyMock,
    dodoV2: (await ethers.getContractFactory(
      "DODOV2Proxy02"
    )) as DODOV2Proxy02__factory,
    dppFactory: (await ethers.getContractFactory(
      "DPPFactory"
    )) as DPPFactory__factory,
    dodoDppProxy: (await ethers.getContractFactory(
      "DODODppProxy"
    )) as DODODppProxy__factory,
    eacProxyMock: (await ethers.getContractFactory(
      "EACAggregatorProxyMock"
    )) as EACAggregatorProxyMock__factory,
  };

  const [deployer, aggrProxySigner] = await ethers.getSigners();
  const builtContracts = {
    base: "",
    quote: "",
    // const dodoDppProxy = resp_dodo_v2.dodoDppProxy as DODODppProxy;
    // const dppFactory = resp_dodo_v2.dppFactory as DPPFactory;
    // const dodoV2Proxy02 = resp_dodo_v2.dodoV2Proxy02 as DODOV2Proxy02;
  };

  const process_input = async () => {
    inquirer.prompt(questions).then(async (answer) => {
      const matchResult = questionsHandler.matchCommand(answer.welcome);
      // console.log({ matchResult });

      await process_input();
    });
  };

  await process_input();
}

start();
