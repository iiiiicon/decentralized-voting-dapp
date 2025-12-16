import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployVoting: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("Deploying VotingSystem...");

  await deploy("VotingSystem", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  console.log("VotingSystem deployed!");
};

export default deployVoting;

deployVoting.tags = ["VotingSystem"];