import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@nomiclabs/hardhat-ethers';
import '@openzeppelin/hardhat-upgrades';
import '@nomiclabs/hardhat-etherscan';
import 'dotenv/config';

const config: HardhatUserConfig = {
	defaultNetwork: 'croffle',
	networks: {
		ganache: {
			url: `http://127.0.0.1:8545`,
			gas: 'auto',
			gasPrice: 10e9,
		},
		croffle: {
			url: `https://cf-node.gesiaplatform.com:8501`,
			accounts: [String(process.env.PRIVATE_KEY)],
			gas: 'auto',
			gasPrice: 10e9,
		},
		sepolia: {
			url: `https://sepolia.infura.io/v3/${String(process.env.SEPOLIA_API_KEY)}`,
			accounts: [String(process.env.PRIVATE_KEY)],
			gas: 'auto',
			chainId: 11155111,
		},
		mumbai: {
			url: `https://alpha-icy-scion.matic-testnet.quiknode.pro/${String(process.env.MUMBAI_API_KEY)}`,
			accounts: [String(process.env.PRIVATE_KEY)],
			gas: 'auto',
			chainId: 80001,
		},
		bsc_testnet: {
			url: `https://wandering-icy-dinghy.bsc-testnet.quiknode.pro/${String(process.env.BSC_TESTNET_API_KEY)}/`,
			accounts: [String(process.env.PRIVATE_KEY)],
			chainId: 97,
			gas: 'auto',
			gasPrice: 20e9,
		},
	},
	etherscan: {
		apiKey: process.env.PLOYGON_API_KEY,
	},
	solidity: {
		version: '0.8.9',
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	},
	paths: {
		sources: './contracts',
		tests: './test',
		cache: './cache',
		artifacts: './artifacts',
	},
	mocha: {
		timeout: 20000,
	},
};

export default config;
