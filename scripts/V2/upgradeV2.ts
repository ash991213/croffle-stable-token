import { ethers, upgrades } from 'hardhat';
import 'dotenv/config';

async function main() {
	const CroffleStableTokenV2 = await ethers.getContractFactory('CroffleStableTokenV2');
	console.log('Upgrading CroffleStableTokenV2...');

	const croffleStableTokenV2 = await upgrades.upgradeProxy(String(process.env.TRANSPARENT_UPGRADEABLE_PROXY_ADDRESS), CroffleStableTokenV2);

	console.log(`CroffleStableTokenV2 deployed to ${croffleStableTokenV2.address}`);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
