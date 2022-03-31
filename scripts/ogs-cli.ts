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
      "swapViaOGS: swapViaOGS gton usdc 100",
      "faucet: faucet gton 100",
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
    const tokensToERC20: Record<string, ERC20> = {
      gton: this.ogs_context.base.attach(tokens.gton),
      usdc: this.ogs_context.base.attach(tokens.usdc),
    };

    switch (spl[0]) {
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
    erc20: (await ethers.getContractFactory(
      "contracts/ERC20/WrappedNative.sol:ERC20"
    )) as ERC20__factory,
  };

  const deployResult = {
    resp_dodo_v2: {
      multicall: "0xC7EF876b38A5b5A6d251fC53e774FF547f461c7C",
      dodoSellHelper: "0xB4E88E860E0c6d017cD2e3e67A69Bb3369F2ac20",
      dodoSwapHelper: "0x3412ee6218596C8De0D62f220BC5af4C588730aB",
      erc20helper: "0x32932FA8A14faA5A28Fa4953FE7Cb96345B66F0d",
      dodoCalleeHelper: "0x0A16F6483f15C12E7e1FE7DC1Bab76242DBe223D",
      dodoV1PmmHelper: "0x3B4eAdCbdE997c4C5bf975F56468490c8761CE1B",
      feeRateModel: "0x87066AA6C10e5A95E4C4F6624174e182e101aA4C",
      userQuota: "0x0fD2E44f2f0339B66711E10993d80df0EeD7Db80",
      feeRateImpl: "0xe7A7f1234d84D737A0909625aC70D8d05948E715",
      permissionManager: "0xF498c3401fc5C401ddbf55D9c039Df0bA027Da25",
      dvmTemplate: "0x577fe52950b26C701F8Ce92c556A832de73Bd999",
      dspTemplate: "0x3fcC20A4c44da09A69A5453Da90948bAe961d02B",
      dppTemplate: "0xE402Bb96943CB86A8Ed46B971216d9eEC40033dD",
      dppAdminTemplate: "0x1091837AB64ce2836287353Ce89f5c6Ee86870AE",
      cpTemplate: "0x1f6526d891cBF675bb8445A5F86f63c49bEc2b91",
      erc20initializable: "0x9bd094b3bb6559748F38A792b885375F4BE89f11",
      erc20Mine: "0x7F2D3D90414203f98b5252F002E07074fA12447D",
      erc20MineV3: "0x90232c10709affcB51dE6eF005C91727A4cD0E57",
      dodoApprove: "0xe2C77C083746119DEc5ddFA25ad15E4cD4A8EF44",
      dodoApproveProxy: "0x625837470ab8fF5EBfB842d688F9278b30465a60",
      erc20V2Factory: "0x05b438A852Cf371b9406B2DBdb36Ab15443Bd851",
      dvmFactory: "0x20276754e01038FF493af32f3D6dCd13346260Ec",
      dppFactory: "0x47FFE5D6015f39Cca39bC5eC518Dd2f9b52135d2",
      upCrowdPoolingFactory: "0xf94D6D2135922565249D9e27c70d674C0C926C27",
      crowdPoolingFactory: "0xf4F6a3F4eBE36E752e0A7C21C199c2967B04aE27",
      dspFactory: "0xcB029B5626667527523425DD30f91Ff468910E18",
      dodoMineV2Factory: "0xF5B1BE7F235E3b69698da373221AE17d7299826e",
      dodoMineV3RegistryFactory: "0x07FAa360D6415c7b088C534D0f4D57F890830D6D",
      dodoV2Helper: "0xAF2d560D2Cb466f7f67d1E647e2C7D33A2b28E7F",
      dodoV1Adapter: "0x205AB83C8C3DDbA13ED872E1688Fb55F1E6D946b",
      dodoV2Adapter: "0xA5525b495596eA70D10993aaCB0A26b7cabaCFD3",
      uniAdapter: "0x0591AEBb33848395768192Ac1683653c9133f9cc",
      dodoV2Proxy02: "0x7F90d4dc38fA19d61622202d028D493f444F5Dff",
      dodoDspProxy: "0x15805c330B41D6455924f38f54A569CcF67cb254",
      dodoCpProxy: "0x9104bFE21B15482f2E38b70f9aAB2b9E15d2E616",
      dodoDppProxy: "0x188289e128E782563BFBe19c32aA9E21Eca208ee",
      dodoMineV3Proxy: "0xC68333E86618AC91689f505356A6B6b6c42e3aBE",
      dodoRouteProxy: "0x5c728E2630108400e34AaE2fF8092209a25033d3",
    },
    OGSDPP: "0x45dbC16c2ddD06E94b6c2C849b88108Df068EC27",
    poolAddr: "0x0FeEDdC4Af11929d00fDA26Efa7626a1bBFB3301",
    poolAddrList: ["0x0FeEDdC4Af11929d00fDA26Efa7626a1bBFB3301"],
    gtonToken: "0x4a8261e2f16288cbf06c14219de2204e1f6c745d",
    usdcToken: "0x6f50cf4327fb7dfb5ca8a3a3768c5ab7f845ac86",
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
