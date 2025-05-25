const hardhat = require("hardhat");
const file = require("fs/promises")

async function main() {
    const Token = await hardhat.ethers.getContractFactory("Token");
    const token = await Token.deploy(1000);
    await token.waitForDeployment();

    const Dex = await hardhat.ethers.getContractFactory("Dex");
    const dex = await Dex.deploy(await token.getAddress(), 10);
    await dex.waitForDeployment();

    await writeDeploymentInfo(token, "./abi/token.json");
    await writeDeploymentInfo(dex, "./abi/dex.json");
}

async function writeDeploymentInfo(contract, fileName = "") {
    const data = {
        network: hardhat.network.name,
        contract: {
            address: await contract.getAddress(),
            signerAddress: (await hardhat.ethers.provider.getSigner()).address,
            abi: contract.interface.format()
        }
    }

    const content = JSON.stringify(data, null, 2);
    file.writeFile(fileName, content, { encoding: 'utf-8' });
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
})