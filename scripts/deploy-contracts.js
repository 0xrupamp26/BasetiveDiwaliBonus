const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying BasetiveDiwaliBonus Smart Contracts...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Contract addresses (you'll need to update these based on your network)
  const AI_ORACLE_ADDRESS = process.env.AI_ORACLE_ADDRESS || "0x0000000000000000000000000000000000000000"; // Replace with actual AI oracle address
  const REWARD_TOKEN_ADDRESS = process.env.REWARD_TOKEN_ADDRESS; // Will be deployed below if not provided

  // Deploy BasetiveDiwaliBonusToken first if not provided
  let rewardTokenAddress = REWARD_TOKEN_ADDRESS;
  if (!rewardTokenAddress) {
    console.log("📄 Deploying BasetiveDiwaliBonusToken contract...");

    const BasetiveDiwaliBonusToken = await ethers.getContractFactory("BasetiveDiwaliBonusToken");
    const basetiveDiwaliBonusToken = await BasetiveDiwaliBonusToken.deploy(
      "BasetiveDiwaliBonus Token", // name
      "BDB",                // symbol
      18,                   // decimals
      ethers.parseEther("1000000"), // initial supply (1M tokens)
      ethers.parseEther("10000000") // max supply (10M tokens)
    );

    await basetiveDiwaliBonusToken.waitForDeployment();
    rewardTokenAddress = await basetiveDiwaliBonusToken.getAddress();

    console.log("✅ BasetiveDiwaliBonusToken deployed to:", rewardTokenAddress);

    // Enable minting for the owner
    await basetiveDiwaliBonusToken.setMintingEnabled(true);
    console.log("✅ Minting enabled for BasetiveDiwaliBonusToken");
  }

  // Deploy BasetiveDiwaliBonus contract
  console.log("🎆 Deploying BasetiveDiwaliBonus contract...");

  const BasetiveDiwaliBonus = await ethers.getContractFactory("BasetiveDiwaliBonus");
  const basetiveDiwaliBonus = await BasetiveDiwaliBonus.deploy(
    AI_ORACLE_ADDRESS,
    rewardTokenAddress,
    ethers.parseEther("1") // base reward amount (1 token)
  );

  await basetiveDiwaliBonus.waitForDeployment();
  const basetiveDiwaliBonusAddress = await basetiveDiwaliBonus.getAddress();

  console.log("✅ BasetiveDiwaliBonus deployed to:", basetiveDiwaliBonusAddress);

  // Fund the contract with some tokens for rewards
  const rewardTokenContract = await ethers.getContractAt("BasetiveDiwaliBonusToken", rewardTokenAddress);
  const rewardAmount = ethers.parseEther("10000"); // 10k tokens for rewards

  await rewardTokenContract.mint(basetiveDiwaliBonusAddress, rewardAmount);
  console.log(`✅ Funded BasetiveDiwaliBonus contract with ${ethers.formatEther(rewardAmount)} tokens`);

  // Save deployment addresses
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: network.name,
    deployer: deployer.address,
    basetiveDiwaliBonusToken: rewardTokenAddress,
    basetiveDiwaliBonus: basetiveDiwaliBonusAddress,
    aiOracle: AI_ORACLE_ADDRESS,
    deploymentTime: new Date().toISOString(),
    baseRewardAmount: "1", // in tokens
    blockNumber: await ethers.provider.getBlockNumber()
  };

  // Save to file
  const deploymentsPath = path.join(__dirname, "..", "deployments.json");
  fs.writeFileSync(deploymentsPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n🎉 Deployment completed successfully!");
  console.log("📋 Deployment info saved to deployments.json");
  console.log("\n📝 Next steps:");
  console.log(`1. Update your .env file with:`);
  console.log(`   NEXT_PUBLIC_DIWALI_LIGHTS_CONTRACT_ADDRESS=${basetiveDiwaliBonusAddress}`);
  console.log(`   NEXT_PUBLIC_REWARD_TOKEN_CONTRACT_ADDRESS=${rewardTokenAddress}`);
  console.log(`2. Run tests: npx hardhat run scripts/test-contracts.js --network ${network.name}`);
  console.log(`3. Deploy to production and verify contracts on BaseScan`);

  return {
    basetiveDiwaliBonusToken: rewardTokenAddress,
    basetiveDiwaliBonus: basetiveDiwaliBonusAddress,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
