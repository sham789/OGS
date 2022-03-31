import Big from "big.js";
import { ethers } from "hardhat";
import { mapValues } from "lodash";
import { Wallet } from "ethers";

import { EACAggregatorProxyMock__factory } from "./../typechain-types/factories/EACAggregatorProxyMock__factory";
import { DODODppProxy__factory } from "./../typechain-types/factories/DODODppProxy__factory";
import { DODODppProxy } from "./../typechain-types/DODODppProxy";
import { DODOV2Proxy02__factory } from "./../typechain-types/factories/DODOV2Proxy02__factory";
import { DPPFactory__factory } from "./../typechain-types/factories/DPPFactory__factory";
import { OGSDPP__factory } from "./../typechain-types/factories/OGSDPP__factory";
import { ERC20PresetFixedSupply__factory } from "./../typechain-types/factories/ERC20PresetFixedSupply__factory";
import { OGSPPool__factory } from "./../typechain-types/factories/OGSPPool__factory";
import { FeeRateModel__factory } from "./../typechain-types/factories/FeeRateModel__factory";
import {
  DPP__factory,
  CloneFactory__factory,
  DPPFactory,
  DODOV2Proxy02,
} from "~/typechain-types";
import { core } from "../tests/migrate";
import { WrappedNative__factory } from "./../typechain-types/factories/WrappedNative__factory";

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

  const erc20fixedSupplyFactory = (await ethers.getContractFactory(
    "ERC20PresetFixedSupply"
  )) as ERC20PresetFixedSupply__factory;

  const gtonToken = await erc20fixedSupplyFactory.deploy(
    "GTON Capital Token",
    "GTON",
    new Big(21_000_000).mul(1e18).toFixed(),
    deployer.address
  );
  const usdcToken = await erc20fixedSupplyFactory.deploy(
    "USD Coin",
    "USDC",
    new Big(1_000_000).mul(1e18).toFixed(),
    deployer.address
  );

  const wethFactory = (await ethers.getContractFactory(
    "WrappedNative"
  )) as WrappedNative__factory;

  const _dppFactory = (await ethers.getContractFactory("DPP")) as DPP__factory;
  const ogsDppFactory = (await ethers.getContractFactory(
    "OGSDPP"
  )) as OGSDPP__factory;
  const factoryOfCloneFactory = (await ethers.getContractFactory(
    "CloneFactory"
  )) as CloneFactory__factory;

  const cloneFactoryContract = await factoryOfCloneFactory.deploy();

  const weth = await wethFactory.deploy();

  // const erc20v3_res = await erc20v3.deployERC20_V3({
  //   erc20: gtonToken.address,
  // } as erc20v3.Input);

  // GNOSIS SAFE
  const multisig = Wallet.createRandom();

  const input: core.Input = {
    deployer,
    wethAddress: weth.address,
    multisigAddress: multisig.address,
    cloneFactoryAddress: cloneFactoryContract.address,
    // cloneFactoryAddress: erc20v3_res.cloneFactoryContract.address,
    initializableERC20Address: gtonToken.address,
    customERC20Address: gtonToken.address,
    defaultMaintainer: deployer.address,
  };

  const resp_dodo_v2 = await core.deployDODO_V2(input);

  const dodoDppProxy = resp_dodo_v2.dodoDppProxy as DODODppProxy;
  const dppFactory = resp_dodo_v2.dppFactory as DPPFactory;
  const dodoV2Proxy02 = resp_dodo_v2.dodoV2Proxy02 as DODOV2Proxy02;

  const OGSDPP = await ogsDppFactory.deploy();

  const K = 0.5;
  const I = 2;
  const feeRate = 0.0;

  await usdcToken.approve(
    resp_dodo_v2.dodoApprove.address,
    new Big(10_000).mul(1e18).toFixed()
  );
  await gtonToken.approve(
    resp_dodo_v2.dodoApprove.address,
    new Big(10_000).mul(1e18).toFixed()
  );

  const poolDeployResp = await dodoDppProxy.createDODOPrivatePool(
    gtonToken.address,
    usdcToken.address,
    new Big(10_000).mul(1e18).toFixed(), // BASE
    new Big(10_000).mul(1e18).toFixed(), // QUOTE
    new Big(feeRate).mul(1e18).toFixed(),
    new Big(I).mul(1e18).toFixed(), // default (I)
    new Big(K).mul(1e18).toFixed(), // default (K)
    false,
    "99999999999"
  );

  console.log({ poolDeployResp });

  const poolAddrList = await dppFactory.getDODOPool(
    gtonToken.address,
    usdcToken.address
  );
  const poolAddr = poolAddrList[0];

  const dppTempl = _dppFactory.attach(poolAddr);
  // const dppBalanceGetter = await buildDPPGetter(dppTempl);

  const swapAmount = 100;
  console.log({ K, I });

  await gtonToken.approve(
    OGSDPP.address,
    new Big(swapAmount).mul(1e18).toFixed()
  );
  await OGSDPP.swapPrivatePool(
    poolAddr,
    gtonToken.address,
    usdcToken.address,
    new Big(swapAmount).mul(1e18).toFixed(),
    deployer.address,
    true
  );
}

start();
