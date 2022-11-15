import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Lock", function () {
  // DEPLOY TEST SMART CONTRACT
  async function deployOneYearLockFixture() {
    // Define helper variables
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const ONE_GWEI = 1_000_000_000;

    // Define function arguments for the smart contract
    const lockedAmount = ONE_GWEI;
    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    // Get the test accounts
    const [owner, otherAccount] = await ethers.getSigners();

    // Deploy the Test Smart Contract for Lock
    const Lock = await ethers.getContractFactory("Lock");
    const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

    return { lock, unlockTime, lockedAmount, owner, otherAccount };
  }
  // TEST IF SMART CONTRACT WAS DEPLOYED CORRECTLY
  describe("Deployment", function () {
    it("Should have set the right unlockTime", async function () {
      // FETCH deployment function objects
      const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture);
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });

    it("Should have the correct owner", async function () {
      const { lock, owner } = await loadFixture(deployOneYearLockFixture);
      // .address used to access the address to compare with solidity address
      expect(await lock.owner()).to.equal(owner.address);
    });

    it("Should have recieved correct amount of GWEI", async function () {
      const { lock, lockedAmount } = await loadFixture(
        deployOneYearLockFixture
      );
      expect(await ethers.provider.getBalance(lock.address)).to.equal(
        lockedAmount
      );
    });

    it("Should fail if deployed with unlockTime not in the present", async function () {
      const latestTime = await time.latest();
      const Lock = await ethers.getContractFactory("Lock");
      // .revertedWith should have the EXACT same error message in the solidity require statement
      await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
        "Please set an unlock time that is in the future"
      );
    });
  });

  describe("Lets Test Withdrawals!", function () {
    // Lets test if the smart contract functions work correctly!
    describe("Testing Withdrawal Validation", function () {
      it("Should fail to withdraw due to unlock time not reached", async function () {
        const { lock } = await loadFixture(deployOneYearLockFixture);
        await expect(lock.withdraw()).to.be.revertedWith(
          "Withdrawal not ready yet!"
        );
      });

      it("Should fail if withdrawal called from account other than owner", async function () {
        const { lock, unlockTime, otherAccount } = await loadFixture(
          deployOneYearLockFixture
        );

        // First skip to unlockTime
        await time.increaseTo(unlockTime);

        // Use lock.connect to send a transaction from another account (since default is acc1)
        await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
          "Only owner can withdraw!"
        );
      });

      it("Should NOT fail if withdrawal passes all requirements", async function () {
        const { lock, unlockTime } = await loadFixture(
          deployOneYearLockFixture
        );
        await time.increaseTo(unlockTime);
        await expect(lock.withdraw()).not.to.be.reverted;
      });
    });
    // Lets test if the correct event was emitted!
    describe("Testing Event emission", function () {
      it("Should emit event with successful withdrawal", async function () {
        const { lock, unlockTime, lockedAmount } = await loadFixture(
          deployOneYearLockFixture
        );

        await time.increase(unlockTime);

        await expect(lock.withdraw())
          .to.emit(lock, "Withdrawal")
          .withArgs(lockedAmount, anyValue); // anyValue is used for the "when" argument of the event
      });
    });
    // Lets test if we can transfer the funds!
    describe("Transfers", function () {
      it("Should transfer the funds to the owner", async function () {
        const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
          deployOneYearLockFixture
        );
        await time.increaseTo(unlockTime);
        await expect(lock.withdraw()).to.changeEtherBalances(
          [owner, lock],
          [lockedAmount, -lockedAmount]
          // First pass in the addresses you want to check
          // Then what they changed by (in respective orders)
        );
      });
    });
  });
});
