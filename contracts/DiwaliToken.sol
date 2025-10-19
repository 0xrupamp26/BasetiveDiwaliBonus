// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract BasetiveDiwaliBonusToken is ERC20, Ownable, Pausable {
    uint8 private _decimals;
    uint256 public maxSupply;
    bool public mintingEnabled;

    // Events
    event MintingEnabled(bool enabled);
    event MaxSupplyUpdated(uint256 newMaxSupply);

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply,
        uint256 _maxSupply
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _decimals = decimals_;
        maxSupply = _maxSupply;
        mintingEnabled = true;

        // Mint initial supply to owner
        if (initialSupply > 0) {
            _mint(msg.sender, initialSupply * 10**decimals_);
        }
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(mintingEnabled, "Minting is disabled");
        require(totalSupply() + amount <= maxSupply, "Would exceed maximum supply");

        _mint(to, amount);
    }

    function mintBatch(address[] memory recipients, uint256[] memory amounts) external onlyOwner {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(mintingEnabled, "Minting is disabled");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        require(totalSupply() + totalAmount <= maxSupply, "Would exceed maximum supply");

        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
        }
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function burnFrom(address account, uint256 amount) external {
        _spendAllowance(account, msg.sender, amount);
        _burn(account, amount);
    }

    function setMintingEnabled(bool enabled) external onlyOwner {
        mintingEnabled = enabled;
        emit MintingEnabled(enabled);
    }

    function setMaxSupply(uint256 newMaxSupply) external onlyOwner {
        require(newMaxSupply >= totalSupply(), "Cannot set max supply below current total supply");
        maxSupply = newMaxSupply;
        emit MaxSupplyUpdated(newMaxSupply);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        super._update(from, to, value);
    }
}
