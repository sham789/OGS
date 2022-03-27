import Big from "big.js";
import { ethers } from "hardhat";
import { mapValues } from "lodash";

import { EACAggregatorProxyMock__factory } from "./../typechain-types/factories/EACAggregatorProxyMock__factory";
import { DODODppProxy__factory } from "./../typechain-types/factories/DODODppProxy__factory";
import { DODODppProxy } from "./../typechain-types/DODODppProxy";
import { DODOV2Proxy02__factory } from "./../typechain-types/factories/DODOV2Proxy02__factory";
import { DPPFactory__factory } from "./../typechain-types/factories/DPPFactory__factory";
import { OGSDPP__factory } from "./../typechain-types/factories/OGSDPP__factory";
import { ERC20PresetFixedSupply__factory } from "./../typechain-types/factories/ERC20PresetFixedSupply__factory";
import { OGSPPool__factory } from "./../typechain-types/factories/OGSPPool__factory";
import { FeeRateModel__factory } from "./../typechain-types/factories/FeeRateModel__factory";

class EACDataBuilder {
  static buildConstructorArgs(amt: number, dec: number): [string, string] {
    return [
      new Big(amt).mul(Math.pow(10, dec)).toFixed(),
      new Big(dec).toFixed(),
    ];
  }
}

async function start() {
  const [deployer] = await ethers.getSigners();

  const factories = {
    ogsPPool: (await ethers.getContractFactory(
      "OGSPPool"
    )) as OGSPPool__factory,
    ogsDPP: (await ethers.getContractFactory("OGSDPP")) as OGSDPP__factory,
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
    feeRateModel: (await ethers.getContractFactory(
      "FeeRateModel"
    )) as FeeRateModel__factory,
    erc20fixedSupplyFactory: (await ethers.getContractFactory(
      "ERC20PresetFixedSupply"
    )) as ERC20PresetFixedSupply__factory,
  };

  const gtonToken = await factories.erc20fixedSupplyFactory.deploy(
    "GTON Capital Token",
    "GTON",
    new Big(21_000_000).mul(1e18).toFixed(),
    deployer.address
  );
  const usdcToken = await factories.erc20fixedSupplyFactory.deploy(
    "USD Coin",
    "USDC",
    new Big(1_000_000).mul(1e18).toFixed(),
    deployer.address
  );
  const response: Record<string, any> = {};

  response.gtonToken = gtonToken;
  response.usdcToken = usdcToken;

  const feeRate = 0.0;
  const K = 0.1;
  const I = 1.5;
  const decimalsEAC = 6;

  const eac = await factories.eacProxyMock.deploy(
    ...EACDataBuilder.buildConstructorArgs(I, decimalsEAC)
  );
  console.log({ eac: eac.address });
  response.eacProxyMock = eac;

  const feeRateModel = await factories.feeRateModel.deploy();
  await feeRateModel.initOwner(await deployer.getAddress());

  response.feeRateModel = feeRateModel;

  const ogsPPool = await factories.ogsPPool.deploy(eac.address);
  response.ogsPPool = ogsPPool;

  response.ogsDPP = await factories.ogsDPP.deploy();

  await ogsPPool.init(
    deployer.address,
    deployer.address,
    gtonToken.address,
    usdcToken.address,
    new Big(feeRate).mul(1e18).toFixed(), // default
    feeRateModel.address,
    new Big(K).mul(1e18).toFixed(), // default (K)
    new Big(I).mul(1e18).toFixed(), // default (I)
    true
  );

  console.log({ response: mapValues(response, (x) => x.address) });
}

start();
