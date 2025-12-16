import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("VotingSystem", function () {
  let votingSystem: any;
  let owner: any;
  let voter1: any;
  let voter2: any;

  beforeEach(async function () {
    [owner, voter1, voter2] = await ethers.getSigners();
    
    const VotingSystem = await ethers.getContractFactory("VotingSystem");
    votingSystem = await VotingSystem.deploy();
    await votingSystem.waitForDeployment();
  });

  it("Should create voting", async function () {
    await votingSystem.createVoting(
      "Test Voting",
      "Test Description",
      ["Alice", "Bob"],
      ["Desc A", "Desc B"],
      60
    );

    const info = await votingSystem.getVotingInfo(1);
    expect(info.title).to.equal("Test Voting");
    expect(info.isActive).to.be.true;
  });

  it("Should allow voting", async function () {
    await votingSystem.createVoting(
      "Test",
      "Desc",
      ["A", "B"],
      ["DA", "DB"],
      60
    );

    await votingSystem.connect(voter1).vote(1, 0);
    
    const hasVoted = await votingSystem.hasUserVoted(1, voter1.address);
    expect(hasVoted).to.be.true;
  });

  it("Should get candidates", async function () {
    await votingSystem.createVoting(
      "Test",
      "Desc",
      ["Candidate 1", "Candidate 2"],
      ["Desc 1", "Desc 2"],
      60
    );

    const candidates = await votingSystem.getCandidates(1);
    expect(candidates.length).to.equal(2);
    expect(candidates[0].name).to.equal("Candidate 1");
  });
});