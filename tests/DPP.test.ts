import { OGSDPP__factory } from "./../typechain-types/factories/OGSDPP__factory";
import { DODOV2Proxy02 } from "./../typechain-types/DODOV2Proxy02";
import { DPPFactory__factory } from "./../typechain-types/factories/DPPFactory__factory";
import { DODODppProxy__factory } from "./../typechain-types/factories/DODODppProxy__factory";
import { DODODppProxy } from "./../typechain-types/DODODppProxy";
import { DODOSellHelper__factory } from "./../typechain-types/factories/DODOSellHelper__factory";
import { DODOApprove__factory } from "./../typechain-types/factories/DODOApprove__factory";
import { DODOApproveProxy__factory } from "./../typechain-types/factories/DODOApproveProxy__factory";
import { CloneFactory__factory } from "./../typechain-types/factories/CloneFactory__factory";
import { DVM__factory } from "./../typechain-types/factories/DVM__factory";
import { DVMFactory__factory } from "./../typechain-types/factories/DVMFactory__factory";
import { DVMFactory } from "./../typechain-types/DVMFactory";
import { DODOV2Proxy02__factory } from "./../typechain-types/factories/DODOV2Proxy02__factory";
import { ERC20 } from "./../typechain-types/ERC20";
import { ERC20__factory } from "./../typechain-types/factories/ERC20__factory";
import { assert } from "chai";
import { BigNumberish, Signer, Wallet } from "ethers";
import { ethers } from "hardhat";

import Big from "big.js";
import { mapValues } from "lodash";

import { ERC20PresetFixedSupply } from "../typechain-types/ERC20PresetFixedSupply";
import { ERC20PresetFixedSupply__factory } from "../typechain-types/factories/ERC20PresetFixedSupply__factory";
import { WrappedNative__factory } from "./../typechain-types/factories/WrappedNative__factory";

import { erc20v3, core, ogs  } from "./migrate";
import { prettyPrint, prettyPrintContractDeployment } from "./utils";
import { DPP } from "../typechain-types/DPP";
import { DPPFactory } from "./../typechain-types/DPPFactory";
import { decimalStr } from "../test/utils/Converter";
import { DPP__factory } from "./../typechain-types/factories/DPP__factory";
import { FeeRateModel__factory } from "./../typechain-types/factories/FeeRateModel__factory";

describe("DPP test coverage", () => {
  const buildDPPGetter = async (contract: DPP) => {
    const erc20factory = (await ethers.getContractFactory(
      "contracts/ERC20/ERC20PresetFixedSupply.sol:ERC20"
    )) as ERC20__factory;

    return async (trader: string) => {
      const base = await erc20factory.attach(await contract._BASE_TOKEN_());
      const quote = await erc20factory.attach(await contract._QUOTE_TOKEN_());
      const maintainer = await contract._MAINTAINER_();

      return {
        traderBase: (await base.balanceOf(trader)).toString(),
        traderQuote: (await quote.balanceOf(trader)).toString(),
        DPPBase: (await base.balanceOf(contract.address)).toString(),
        DPPQuote: (await quote.balanceOf(contract.address)).toString(),
        maintainerBase: (await base.balanceOf(maintainer)).toString(),
        maintainerQuote: (await quote.balanceOf(maintainer)).toString(),
      };
    };
  };

  describe("trader tests", async () => {
    it("first buy", async () => {
      const [deployer, trader] = await ethers.getSigners();

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

      const weth = await wethFactory.deploy();

      const erc20v3_res = await erc20v3.deployERC20_V3({
        erc20: gtonToken.address,
      } as erc20v3.Input);

      // GNOSIS SAFE
      const multisig = Wallet.createRandom();

      const input: core.Input = {
        deployer,
        wethAddress: weth.address,
        multisigAddress: multisig.address,
        cloneFactoryAddress: erc20v3_res.cloneFactoryContract.address,
        initializableERC20Address: gtonToken.address,
        customERC20Address: gtonToken.address,
        defaultMaintainer: deployer.address,
      };

      // const resp_dodo_v2 = await core.deployDODO_V2(input);
      const resp_dodo_v2 = await ogs.deployOGS(input);

      const dppContract = resp_dodo_v2.dppTemplate as DPP;

      const K = 0.1;
      const I = 1.5;

      const feeRate = 0.002;

      await dppContract.init(
        deployer.address,
        deployer.address,
        gtonToken.address,
        usdcToken.address,
        new Big(feeRate).mul(1e18).toFixed(), // default
        resp_dodo_v2.feeRateModel.address,
        new Big(K).mul(1e18).toFixed(), // default (K)
        new Big(I).mul(1e18).toFixed(), // default (I)
        true
      );

      const dppBalanceGetter = await buildDPPGetter(dppContract);

      const erc20factory = (await ethers.getContractFactory(
        "contracts/ERC20/ERC20PresetFixedSupply.sol:ERC20"
      )) as ERC20__factory;
      const base = await erc20factory.attach(await dppContract._BASE_TOKEN_());
      const quote = await erc20factory.attach(
        await dppContract._QUOTE_TOKEN_()
      );

      // init
      await base.transfer(dppContract.address, decimalStr("10"));
      await quote.transfer(dppContract.address, decimalStr("1000"));

      let balances_before = await dppBalanceGetter(deployer.address);

      console.log({
        balances_before: mapValues(balances_before, (x) =>
          new Big(x).div(1e18).toNumber()
        ),
      });

      await dppContract.reset(
        deployer.address,
        decimalStr(String(feeRate)),
        decimalStr(String(I)),
        decimalStr(String(K)),
        "0",
        "0",
        "0",
        "0"
      );

      // buy at R=1
      await quote.transfer(dppContract.address, decimalStr(String(I)));
      await dppContract.sellQuote(deployer.address);

      let balances = await dppBalanceGetter(trader.address);

      console.log({
        balances_after: mapValues(balances, (x) =>
          new Big(x).div(1e18).toNumber()
        ),
      });

      console.log({
        balance_diff: {
          pool_base: new Big(balances.DPPBase)
            .sub(balances_before.DPPBase)
            .div(1e18)
            .toNumber(),
          pool_quote: new Big(balances.DPPQuote)
            .sub(balances_before.DPPQuote)
            .div(1e18)
            .toNumber(),
        },
      });

      // // buy at R>1
      // await quote.transfer(dppContract.address, decimalStr("100"));
      // await dppContract.sellQuote(deployer.address);
      await dppContract.sellQuote(trader.address);

      balances = await dppBalanceGetter(deployer.address);

      console.log({
        balances_after: mapValues(balances, (x) =>
          new Big(x).div(1e18).toNumber()
        ),
      });
    });

    it("buy and sell via DODOV2Proxy", async () => {
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

      const _dppFactory = (await ethers.getContractFactory(
        "DPP"
      )) as DPP__factory;
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
      const dppBalanceGetter = await buildDPPGetter(dppTempl);

      console.log({ K, I });

      // Swap <N> times and check liquidity
      for (let i = 0; i < 10; i++) {
        const swapAmount = 300;

        const balances_before = await dppBalanceGetter(deployer.address);
        const mapped_balances_before = mapValues(balances_before, (x) =>
          new Big(x).div(1e18).toNumber()
        );

        /** BASIC INTERFACE OF DODO V2 PROXY */
        // await gtonToken.approve(
        //   resp_dodo_v2.dodoApprove.address,
        //   new Big(swapAmount).mul(1e18).toFixed()
        // );
        // await dodoV2Proxy02.dodoSwapV2TokenToToken(
        //   gtonToken.address,
        //   usdcToken.address,
        //   new Big(swapAmount).mul(1e18).toFixed(),
        //   "1",
        //   [poolAddr],
        //   "0",
        //   false,
        //   "999999999999999"
        // );

        /** INTERFACE OF OGS DPP */
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

        const balances_after = await dppBalanceGetter(deployer.address);
        const mapped_balances_after = mapValues(balances_after, (x) =>
          new Big(x).div(1e18).toNumber()
        );

        console.log({
          iteration: i,
          balances_after: mapped_balances_after,
          balance_diff: {
            DPPBase:
              mapped_balances_after.DPPBase - mapped_balances_before.DPPBase,
            DPPQuote:
              mapped_balances_after.DPPQuote - mapped_balances_before.DPPQuote,
          },
        });
      }
    });
  });
});
