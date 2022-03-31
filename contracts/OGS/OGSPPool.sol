// SPDX-License-Identifier: MIT

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {DPP} from "contracts/DODOPrivatePool/impl/DPP.sol";
import {PMMPricing} from "contracts/lib/PMMPricing.sol";

interface IEACAggregatorProxy {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );

    function decimals() external view returns (uint8);
}

contract OGSPPool is DPP {
    IEACAggregatorProxy private _refDON;

    constructor(address refDON) public {
        _refDON = IEACAggregatorProxy(refDON);
    }

    function getPMMState()
        public
        view
        override
        returns (PMMPricing.PMMState memory state)
    {
        state.i = _I_;
        state.K = _readDONPrice();
        state.B = _BASE_RESERVE_;
        state.Q = _QUOTE_RESERVE_;
        state.B0 = _BASE_TARGET_;
        state.Q0 = _QUOTE_TARGET_;
        state.R = PMMPricing.RState(_RState_);
        PMMPricing.adjustedTarget(state);
    }

    function readDONPrice() external view returns (uint256) {
        return _readDONPrice();
    }

    function _readDONPrice() internal view returns (uint256) {
        IEACAggregatorProxy priceFeed = IEACAggregatorProxy(_refDON);
        (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        uint256 decimals = priceFeed.decimals();
        require(
            decimals >= 0 && answer > 0,
            "DON Error: price data and decimals must be higher than 0"
        );
        uint256 n = 10**18;
        uint256 d = 10**decimals;
        return ((uint256(answer) * n) / d);
    }
}
