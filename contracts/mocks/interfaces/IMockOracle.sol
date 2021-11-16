pragma solidity >=0.4.24;

interface IMockOracle {

    function getPrice(address asset) external view returns (uint256 price);

}