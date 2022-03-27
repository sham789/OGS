import { assert } from "chai";
import { BigNumberish, Signer, Wallet } from "ethers";
import { ethers } from "hardhat";

import Big from "big.js";

import { ERC20PresetFixedSupply } from "../typechain-types/ERC20PresetFixedSupply";
import { ERC20PresetFixedSupply__factory } from "../typechain-types/factories/ERC20PresetFixedSupply__factory";
import { WrappedNative__factory } from "./../typechain-types/factories/WrappedNative__factory";

import { erc20v3, core } from "./migrate";
import { prettyPrint, prettyPrintContractDeployment } from "./utils";

describe("generic tests coverage", () => {
  const deployTestGTON = async (from: Signer) => {
    const erc20fixedSupplyFactory = (await ethers.getContractFactory(
      "ERC20PresetFixedSupply"
    )) as ERC20PresetFixedSupply__factory;

    const testToken = await erc20fixedSupplyFactory.deploy(
      "GTON Capital Token",
      "GTON",
      new Big(21_000_000).mul(1e18).toFixed(),
      await from.getAddress()
    );

    return testToken;
  };

  it("test erc20 core migrator", async () => {
    const [wallet] = await ethers.getSigners();

    const testToken = await deployTestGTON(wallet);

    const resp = await erc20v3.deployERC20_V3({
      erc20: testToken.address,
    } as erc20v3.Input);

    console.log({
      erc20v3_result: prettyPrintContractDeployment(resp),
    });
  });

  it("test deploy v2 core", async () => {
    const [deployer] = await ethers.getSigners();

    const testToken = await deployTestGTON(deployer);

    const wethFactory = (await ethers.getContractFactory(
      "WrappedNative"
    )) as WrappedNative__factory;

    const weth = await wethFactory.deploy();

    const erc20v3_res = await erc20v3.deployERC20_V3({
      erc20: testToken.address,
    } as erc20v3.Input);

    // GNOSIS SAFE
    const multisig = Wallet.createRandom();

    const input: core.Input = {
      deployer,
      wethAddress: weth.address,
      multisigAddress: multisig.address,
      cloneFactoryAddress: erc20v3_res.cloneFactoryContract.address,
      initializableERC20Address: testToken.address,
      customERC20Address: testToken.address,
      defaultMaintainer: deployer.address,
    };

    const resp_dodo_v2 = await core.deployDODO_V2(input);

    console.log({
      erc20v3_res: prettyPrintContractDeployment(erc20v3_res),
      resp_dodo_v2: prettyPrintContractDeployment(resp_dodo_v2),
    });
  });
});
