import { ethers, upgrades } from 'hardhat';
import 'dotenv/config';

async function main() {
	const CroffleStableTokenV1 = await ethers.getContractFactory('CroffleStableTokenV1');
	console.log('Deploying CroffleStableTokenV1...');

	const croffleStableTokenV1 = await upgrades.deployProxy(CroffleStableTokenV1, [process.env.CONTRACT_OWNER, process.env.CONTRACT_PROPOSED_OWNER, process.env.CONTRACT_TOTALSUPPLY_MANAGER], {
		initializer: 'initialized',
	});
	await croffleStableTokenV1.deployed();

	console.log(`CroffleStableTokenV1 deployed to ${croffleStableTokenV1.address}`);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
