// SPDX-License-Identifier: MIT
// solhint-disable not-rely-on-time

pragma solidity ^0.8.3;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../libraries/IterableMapping.sol";
import "../mocks/interfaces/IMockOracle.sol";
import "../interfaces/IIndexContract.sol";
import "../tokens/Token.sol";

contract IndexContract is IIndexContract, Ownable {
    using SafeMath for uint256;
    using IterableMapping for IterableMapping.Map;

    /* ========== STATE VARIABLES ========== */

    Token public indexToken;
    IterableMapping.Map private assets;
    IMockOracle internal oracle;

    uint256 totalIndexTokenMinted = 0;

    /* ========== CONSTRUCTOR ========== */

    constructor(
        address _indexToken,
        address _oracle
    ) {
        indexToken = Token(_indexToken);
        oracle = IMockOracle(_oracle);
    }

    function deposit(address _asset, uint256 _amount) external override {
        uint256 depositedAssetPrice = oracle.getPrice(_asset);
        require((depositedAssetPrice != 0), "depositedAssetPrice is 0");
        uint256 depositedAssetValue = depositedAssetPrice.mul(_amount).div(1e18);
        require((depositedAssetValue.div(1e18) >= 1000), "deposited assets needs to be no less than 1000 USD");

        uint256 indexTokenPrice;

        if (msg.sender == owner()) {
            indexTokenPrice = 100;
        } else {
            uint256 sumOverIndexAssets = 0;

            for (uint256 i = 0; i < assets.size(); i++) {
                address keyAtIndex = assets.getKeyAtIndex(i);
                sumOverIndexAssets += assets.get(keyAtIndex).mul(oracle.getPrice(keyAtIndex)).div(1e18);
            }

            indexTokenPrice = sumOverIndexAssets.div(totalIndexTokenMinted);
        }

        uint256 indexTokenAmount = depositedAssetValue.div(indexTokenPrice);

        indexToken.mint(msg.sender, indexTokenAmount);

        totalIndexTokenMinted += indexTokenAmount;
        uint256 oldAssetValue = assets.get(_asset);
        assets.set(_asset, (oldAssetValue + _amount));
    }
}
