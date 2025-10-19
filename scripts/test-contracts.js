const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🧪 Testing BasetiveDiwaliBonus Smart Contracts...");

  // Load deployment info
  const deploymentsPath = path.join(__dirname, "..", "deployments.json");
  if (!fs.existsSync(deploymentsPath)) {
    console.error("❌ No deployment info found. Please run deploy-contracts.js first.");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  const { basetiveDiwaliBonusToken: tokenAddress, basetiveDiwaliBonus: lightsAddress } = deploymentInfo;

  // Get signers
  const [owner, user1, user2] = await ethers.getSigners();

  console.log("\n📋 Test Accounts:");
  console.log("Owner:", owner.address);
  console.log("User1:", user1.address);
  console.log("User2:", user2.address);

  // Get contract instances
  const basetiveDiwaliBonusToken = await ethers.getContractAt("BasetiveDiwaliBonusToken", tokenAddress);
  const basetiveDiwaliBonus = await ethers.getContractAt("BasetiveDiwaliBonus", lightsAddress);

  console.log("\n🔍 Testing BasetiveDiwaliBonusToken...");

  // Check initial supply
  const totalSupply = await basetiveDiwaliBonusToken.totalSupply();
  console.log(`Total supply: ${ethers.formatEther(totalSupply)} tokens`);

  // Check owner balance
  const ownerBalance = await basetiveDiwaliBonusToken.balanceOf(owner.address);
  console.log(`Owner balance: ${ethers.formatEther(ownerBalance)} tokens`);

  console.log("\n🎆 Testing BasetiveDiwaliBonus...");

  // Check contract parameters
  const baseReward = await basetiveDiwaliBonus.baseRewardAmount();
  const bonusMultiplier = await basetiveDiwaliBonus.bonusMultiplier();
  const cooldownPeriod = await basetiveDiwaliBonus.cooldownPeriod();

  console.log(`Base reward amount: ${ethers.formatEther(baseReward)} tokens`);
  console.log(`Bonus multiplier: ${bonusMultiplier}x`);
  console.log(`Cooldown period: ${cooldownPeriod / 3600} hours`);

  // Test submission limits
  const maxSubmissionsPerUser = await basetiveDiwaliBonus.maxSubmissionsPerUser();
  const maxSubmissions = await basetiveDiwaliBonus.maxSubmissions();

  console.log(`Max submissions per user: ${maxSubmissionsPerUser}`);
  console.log(`Max total submissions: ${maxSubmissions}`);

  // Test contract balance
  const contractBalance = await basetiveDiwaliBonusToken.balanceOf(basetiveDiwaliBonus.address);
  console.log(`Contract balance: ${ethers.formatEther(contractBalance)} tokens`);

  console.log("\n✅ All tests completed successfully!");

  console.log("\n🎉 All tests completed successfully!");
  console.log("\nContract addresses for frontend:");
  console.log(`BasetiveDiwaliBonusToken: ${tokenAddress}`);
  console.log(`BasetiveDiwaliBonus: ${lightsAddress}`);

  return {
    tokenAddress,
    lightsAddress,
    totalSupply: ethers.formatEther(totalSupply),
    contractBalance: ethers.formatEther(contractBalance),
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Tests failed:", error);
    process.exit(1);
  });
