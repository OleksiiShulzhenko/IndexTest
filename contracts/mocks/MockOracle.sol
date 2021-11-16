pragma solidity ^0.8.3;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./interfaces/IMockOracle.sol";

contract MockOracle is IMockOracle {
    using SafeMath for uint256;

    mapping(address => uint256) internal prices;

    constructor(address[] memory _assets, uint256[] memory _prices) public {
        setPrices(_assets, _prices);
    }

    function setPrices(address[] memory _assets, uint256[] memory _prices)
        public
    {
        require(
            _assets.length == _prices.length,
            "the quantity does not match"
        );

        for (uint256 i = 0; i < _assets.length; i++) {
            prices[_assets[i]] = _prices[i];
        }
    }

    function getPrice(address asset) public view override returns (uint256 price) {
        return (prices[asset]);
    }
}
