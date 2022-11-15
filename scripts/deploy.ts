import { ethers } from "hardhat";

async function main() {
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  const unlockTime = currentTimestampInSeconds + ONE_YEAR_IN_SECS;
  
  const lockedAmount = ethers.utils.parseEther("1");

  const Lock = await ethers.getContractFactory("Lock");
  const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

  await lock.deployed();

  console.log(`Deployed Lock with 1 ETH and unlock timestamp ${unlockTime} deployed to ${lock.address}`);
}

// To use async/await everywhere and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});