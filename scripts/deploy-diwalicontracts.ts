import { ethers, network, run } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function main() {
  console.log("🚀 Starting Diwali Contracts Deployment...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer address: ${deployer.address}`);
  console.log(`💼 Deployer balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
  console.log(`🌐 Network: ${network.name} (Chain ID: ${network.config.chainId})`);

  // 1. Deploy DiwaliToken
  console.log("\n1️⃣ Deploying DiwaliToken...");
  const DiwaliToken = await ethers.getContractFactory("DiwaliToken");
  const initialSupply = ethers.parseEther("1000000"); // 1M tokens
  const token = await DiwaliToken.deploy(initialSupply);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log(`✅ DiwaliToken deployed to: ${tokenAddress}`);

  // 2. Deploy DiwaliLights
  console.log("\n2️⃣ Deploying DiwaliLights...");
  const DiwaliLights = await ethers.getContractFactory("DiwaliLights");
  const lights = await DiwaliLights.deploy(tokenAddress);
  await lights.waitForDeployment();
  const lightsAddress = await lights.getAddress();
  console.log(`✅ DiwaliLights deployed to: ${lightsAddress}`);

  // 3. Transfer tokens to DiwaliLights contract
  console.log("\n3️⃣ Transferring tokens to DiwaliLights...");
  const transferTx = await token.transfer(lightsAddress, initialSupply);
  await transferTx.wait();
  console.log(`✅ Transferred ${ethers.formatEther(initialSupply)} tokens to DiwaliLights`);

  // 4. Update .env file
  console.log("\n4️⃣ Updating environment variables...");
  const envPath = path.join(__dirname, "..", ".env");
  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";
  
  // Remove existing contract addresses
  envContent = envContent
    .split("\n")
    .filter(line => !line.startsWith("NEXT_PUBLIC_DIWALI_TOKEN_CONTRACT_ADDRESS=") && 
                   !line.startsWith("NEXT_PUBLIC_DIWALI_LIGHTS_CONTRACT_ADDRESS="))
    .join("\n");
  
  // Add new contract addresses
  envContent += `\nNEXT_PUBLIC_DIWALI_TOKEN_CONTRACT_ADDRESS=${tokenAddress}`;
  envContent += `\nNEXT_PUBLIC_DIWALI_LIGHTS_CONTRACT_ADDRESS=${lightsAddress}`;
  
  fs.writeFileSync(envPath, envContent);
  console.log("✅ Updated .env file with contract addresses");

  // 5. Verify contracts on BaseScan (if API key is provided)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\n5️⃣ Verifying contracts on BaseScan...");
    try {
      // Wait for Etherscan to recognize the contract
      console.log("Waiting for block confirmations...");
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      console.log("Verifying DiwaliToken...");
      await run("verify:verify", {
        address: tokenAddress,
        constructorArguments: [initialSupply],
      });
      
      console.log("Verifying DiwaliLights...");
      await run("verify:verify", {
        address: lightsAddress,
        constructorArguments: [tokenAddress],
      });
      
      console.log("✅ Contracts verified successfully!");
    } catch (error) {
      console.log("⚠️ Verification failed:", error.message);
    }
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log(`DiwaliToken: ${tokenAddress}`);
  console.log(`DiwaliLights: ${lightsAddress}`);
  console.log(`\n🔗 BaseScan: https://${network.name === "base_sepolia" ? "sepolia.basescan.io" : "basescan.io"}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });