pragma solidity ^0.8.20;

import "./Token.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

error Dex_NoFunds(address to);
error Dex_InvalidAmount(address buyer, uint256 amount, uint256 requiredAmount);
error Dex_InsufficientBalance(address buyer, uint256 amount);
error Dex_InsufficientSellerBalance(address seller, uint256 amount);

contract Dex {
    address private immutable _owner;
    uint256 private _price;
    IERC20 private _associatedToken;

    mapping(address => uint256) private _clientTokenAmounts;
    mapping(address => uint256) private _cl10362014Dexunts;

    constructor(address token, uint256 price) {
        _owner = msg.sender;
        _price = price;
        _associatedToken = IERC20(token);
    }

    modifier onlyOwner() {
        require(msg.sender == _owner, "you are not the owner.");
        _;
    }

    function sell() external onlyOwner {
        uint256 allowedAmount = _associatedToken.allowance(
            _owner,
            address(this)
        );
        require(
            allowedAmount > 0,
            "You must allow this DEX contract access to at least one token."
        );
        bool sent = _associatedToken.transferFrom(
            _owner,
            address(this),
            allowedAmount
        );
        require(sent, "Token transfer from owner to DEX failed");
    }

    function withdrawTokens() external onlyOwner {
        uint256 dexTokenBalance = _associatedToken.balanceOf(address(this));
        require(dexTokenBalance > 0, "Dex has no tokens.");
        bool sent = _associatedToken.transfer(_owner, dexTokenBalance);
        require(
            sent,
            "Transfer of DEX token balance from DEX to owner failed."
        );
    }

    function withdrawFunds() external onlyOwner {
        uint256 dexBalance = address(this).balance;
        require(dexBalance > 0, "Insufficient balance.");
        (bool sent, ) = payable(_owner).call{value: dexBalance}("");
        require(sent, "Transfer of DEX balance to DEX owner failed.");
    }

    function getTokenPriceInEth() public view returns(uint256) {
        return _price;
    }

    function getPrice(uint256 numTokens) private view returns (uint256) {
        return _price * numTokens;
    }

    function buy(uint256 numTokens) external payable {
        uint256 priceForTokens = getPrice(numTokens);
        if(msg.value != priceForTokens) revert Dex_InvalidAmount(msg.sender, msg.value, priceForTokens);
        require(getTokenBalance() >= numTokens, "DEX has insufficient funds.");
        bool sent = _associatedToken.transfer(msg.sender, numTokens);
        require(sent, "Byuing of tokens from DEX failed.");
    }

    function getTokenBalance() public view returns (uint256) {
        return _associatedToken.balanceOf(address(this));
    }
}
