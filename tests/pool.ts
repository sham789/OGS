import Big from "big.js";
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  BigNumber,
  BigNumberish,
  ContractTransaction,
  Overrides,
  Signer,
  Wallet,
} from "ethers";


import { ERC20PresetFixedSupply } from "../typechain-types/ERC20PresetFixedSupply";
import { ERC20PresetFixedSupply__factory } from "../typechain-types/factories/ERC20PresetFixedSupply__factory";
import { WrappedNative } from "../typechain-types/WrappedNative";
import { WrappedNative__factory } from "../typechain-types/factories/WrappedNative__factory";

export const mapValue = (x: BigNumberish) =>
  new Big(x.toString()).div(1e18).toNumber();

export const defaultUniDeadline = () => 9999999999999;

type DODOParamsPreset = { i: string; k: string; lpFeeRate: string };

const defaultDODOPreset: DODOParamsPreset = {
  lpFeeRate: "3000000000000000", //0.003
  i: "45000000000000000000", //45
  k: "800000000000000000", //0.8
};

export async function buildPool(
  wallet: any,
  feeGetter: string,
  weth: WrappedNative,
  baseToken: ERC20PresetFixedSupply,
  quoteToken: ERC20PresetFixedSupply,
  baseTokenLiq: BigNumber,
  quoteTokenLiq: BigNumber,
  preset: DODOParamsPreset
) {
  // const factoryFactory = (await ethers.getContractFactory(
  //   "QuickFactory"
  // )) as QuickFactory__factory
  // const factory = await factoryFactory.connect(wallet).deploy(wallet.address)
  // await factory.setFeeTo(feeGetter)
  // const routerFactory = (await ethers.getContractFactory(
  //   "QuickRouter01"
  // )) as QuickRouter01__factory
  // const router = await routerFactory.deploy(factory.address, weth.address)
  // const pairFactory = await ethers.getContractFactory("QuickPair")
  // const createPairResult = await factory.createPair(
  //   baseToken.address,
  //   quoteToken.address
  // )
  // const pairAddress = await factory.getPair(
  //   baseToken.address,
  //   quoteToken.address
  // )
  // // console.log({ pairAddress, createPairResult })
  // const pair = pairFactory.attach(pairAddress) as QuickPair
  // // let liquidityGTON = baseTokenLiq
  // // let liquidityWETH = quoteTokenLiq
  // await baseToken.connect(wallet).approve(router.address, baseTokenLiq)
  // await quoteToken.connect(wallet).approve(router.address, quoteTokenLiq)
  // let block = await wallet.provider.getBlock("latest")
  // let timestamp = block.timestamp
  // console.log("addliq", [
  //   baseToken.address,
  //   quoteToken.address,
  //   baseTokenLiq,
  //   quoteTokenLiq,
  //   1,
  //   1,
  //   wallet.address,
  //   timestamp + 3600,
  // ])
  // await router
  //   .connect(wallet)
  //   .addLiquidity(
  //     baseToken.address,
  //     quoteToken.address,
  //     baseTokenLiq,
  //     quoteTokenLiq,
  //     1,
  //     1,
  //     wallet.address,
  //     timestamp + 3600
  //   )
  // await expect(
  //   router.addLiquidity(
  //     baseToken.address,
  //     quoteToken.address,
  //     baseTokenLiq,
  //     quoteTokenLiq,
  //     1,
  //     1,
  //     wallet.address,
  //     timestamp + 3600
  //   )
  // )
  // .to.emit(pair, "Sync")
  // .withArgs(baseTokenLiq.toString(), quoteTokenLiq.toString())
  // .to.emit(pair, "Mint")
  // .withArgs(router.address, baseTokenLiq.toString(), quoteTokenLiq.toString())
  // expect(await pair.token1()).to.eq(baseToken.address)
  // expect(await pair.token0()).to.eq(quoteToken.address)
  // const lpOwnerHoldings = await pair.balanceOf(wallet.address)
  // return { pair, factory, router, lpOwnerHoldings }
}

export const deployTokenFixedSupply = async (
  name: string,
  symbol: string,
  initialSupply: BigNumberish,
  owner: string
): Promise<ERC20PresetFixedSupply> => {
  const tokenFactory = (await ethers.getContractFactory(
    "ERC20PresetFixedSupply"
  )) as ERC20PresetFixedSupply__factory;

  const token = await tokenFactory.deploy(name, symbol, initialSupply, owner);

  return token;
};

// export type CalibrateToken = {
//   name: string
//   symbol: string
// }
// export type CalibrateInput = {
//   mintA: string
//   mintB: string
//   liqA: string
//   liqB: string
//   base: CalibrateToken
//   quote: CalibrateToken
//   targetPrice: number

//   // (x: Big) => x.div(10)
//   removalFn: (x: Big) => Big
// }

// export enum CalibrateDirection {
//   Up,
//   Down,
// }

// export type ProxyCalibrateInput = {
//   mintA: string
//   mintB: string
//   liqA: string
//   liqB: string
//   base: CalibrateToken
//   quote: CalibrateToken
//   direction: CalibrateDirection
//   // percentageOfLPs: { n: number; d: number } // 0 to 1
//   deployer: Signer
//   feeGetter: string
// }

// export async function prepareTokensAndPoolsForProxy(cfg: ProxyCalibrateInput) {
//   const baseToken = await deployTokenFixedSupply(
//     cfg.base.name,
//     cfg.base.symbol,
//     cfg.mintA,
//     await cfg.deployer.getAddress()
//   )
//   const quoteToken = await deployTokenFixedSupply(
//     cfg.quote.name,
//     cfg.quote.symbol,
//     cfg.mintB,
//     await cfg.deployer.getAddress()
//   )

//   const wethFactory = (await ethers.getContractFactory(
//     "WrappedNative"
//   )) as WrappedNative__factory

//   const weth = await wethFactory.deploy()

//   const builtPoolResponse = await buildPool(
//     cfg.deployer,
//     cfg.feeGetter,
//     weth,
//     baseToken,
//     quoteToken,
//     BigNumber.from(cfg.liqA),
//     BigNumber.from(cfg.liqB)
//   )
//   const { router } = builtPoolResponse

//   const calibratorFactory = (await ethers.getContractFactory(
//     "Calibrator"
//   )) as Calibrator__factory

//   const calibrator = await calibratorFactory.deploy(
//     baseToken.address,
//     router.address,
//     "QUICK"
//   )

//   const calibratorProxyFactory = (await ethers.getContractFactory(
//     "CalibratorProxy"
//   )) as CalibratorProxy__factory

//   const calibratorProxy = await calibratorProxyFactory.deploy(
//     calibrator.address,
//     baseToken.address
//   )

//   return {
//     calibratorProxy,
//     calibrator,
//     builtPoolResponse,
//     baseToken,
//     quoteToken,
//   }
// }
