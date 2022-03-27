// SPDX-License-Identifier: MIT

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {SafeMath} from "contracts/lib/SafeMath.sol";
import {ReentrancyGuard} from "contracts/lib/ReentrancyGuard.sol";

import {IERC20} from "contracts/intf/IERC20.sol";

interface IDPPTrader {
    function sellBase(address to) external returns (uint256 receiveQuoteAmount);

    function sellQuote(address to) external returns (uint256 receiveBaseAmount);
}

contract OGSDPP is ReentrancyGuard {
    using SafeMath for uint256;

    function swapPrivatePool(
        IDPPTrader dpp,
        address inputToken,
        address outputToken,
        uint256 inputAmount,
        address to,
        bool isSellingBase
    ) external preventReentrant {
        require(inputToken != outputToken, "OGSDPP: tokens cannot be same");
        require(
            inputToken != address(0) && outputToken != address(0),
            "OGSDPP: tokens cannot be empty"
        );

        uint256 balanceBefore = IERC20(outputToken).balanceOf(to);

        IERC20(inputToken).transferFrom(msg.sender, address(dpp), inputAmount);

        if (isSellingBase) {
            dpp.sellBase(to);
        } else {
            dpp.sellQuote(to);
        }

        uint256 balanceAfter = IERC20(outputToken).balanceOf(to);

        require(balanceAfter > balanceBefore, "OGSDPP: invalid swap");
    }

}
