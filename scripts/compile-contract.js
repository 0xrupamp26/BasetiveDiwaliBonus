const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Ensure the artifacts directory exists
const artifactsDir = path.join(__dirname, '../artifacts/contracts');
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

// Compile the contract
console.log('Compiling DiwaliLights contract...');
try {
  execSync('npx hardhat compile', { stdio: 'inherit' });
  
  // Copy the ABI to the frontend
  const contractArtifact = require('../artifacts/contracts/DiwaliLights.sol/DiwaliLights.json');
  const abiPath = path.join(__dirname, '../src/contracts/DiwaliLightsABI.json');
  
  // Ensure the target directory exists
  const targetDir = path.dirname(abiPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  fs.writeFileSync(abiPath, JSON.stringify(contractArtifact.abi, null, 2));
  console.log('ABI saved to:', abiPath);
  
} catch (error) {
  console.error('Failed to compile contract:', error);
  process.exit(1);
}
