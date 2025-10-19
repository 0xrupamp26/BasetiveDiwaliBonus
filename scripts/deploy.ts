import { ethers, upgrades } from "hardhat";
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log("Starting deployment process...");

  // Get the deployer's account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy DiwaliToken first
  console.log("Deploying DiwaliToken...");
  const DiwaliToken = await ethers.getContractFactory("DiwaliToken");
  const token = await DiwaliToken.deploy();
  await token.deployed();
  console.log("DiwaliToken deployed to:", token.address);

  // Deploy BasetiveDiwaliBonus (DiwaliLights)
  console.log("Deploying BasetiveDiwaliBonus...");
  const BasetiveDiwaliBonus = await ethers.getContractFactory("BasetiveDiwaliBonus");
  
  // If you have constructor parameters, add them here
  const bonus = await BasetiveDiwaliBonus.deploy();
  await bonus.deployed();
  console.log("BasetiveDiwaliBonus deployed to:", bonus.address);

  // Set the reward token in the bonus contract
  console.log("Setting reward token...");
  await bonus.setRewardToken(token.address);
  
  // Optional: Transfer initial tokens to the bonus contract
  const initialSupply = ethers.utils.parseEther("1000000"); // 1M tokens
  await token.transfer(bonus.address, initialSupply);
  console.log(`Transferred ${ethers.utils.formatEther(initialSupply)} tokens to bonus contract`);

  // Save the contract addresses to a file for frontend use
  const fs = require('fs');
  const path = require('path');
  
  const addresses = {
    diwaliToken: token.address,
    basetiveDiwaliBonus: bonus.address,
    network: (await ethers.provider.getNetwork()).chainId,
  };
  
  const addressesPath = path.join(__dirname, '../src/contracts/addresses.json');
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log(`Contract addresses saved to ${addressesPath}`);
  
  // Also update .env.local with the contract addresses
  const envPath = path.join(__dirname, '../.env.local');
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
  
  // Remove existing contract address lines
  envContent = envContent
    .split('\n')
    .filter(line => !line.startsWith('NEXT_PUBLIC_DIWALI_LIGHTS_CONTRACT_ADDRESS=') && 
                   !line.startsWith('NEXT_PUBLIC_DIWALI_TOKEN_CONTRACT_ADDRESS='))
    .join('\n');
  
  // Add new contract addresses
  envContent += `\nNEXT_PUBLIC_DIWALI_LIGHTS_CONTRACT_ADDRESS=${bonus.address}\n`;
  envContent += `NEXT_PUBLIC_DIWALI_TOKEN_CONTRACT_ADDRESS=${token.address}\n`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('Updated .env.local with contract addresses');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
