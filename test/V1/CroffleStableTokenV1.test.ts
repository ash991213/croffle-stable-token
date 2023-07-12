import { ethers } from 'hardhat';
import { Contract, Signer } from 'ethers';
import { expect } from 'chai';

async function errException(promise: Promise<any>): Promise<any> {
	try {
		await promise;
	} catch (error) {
		return error;
	}
	throw new Error('Expected throw not received');
}

describe('CroffleStableTokenV1', function () {
	let token: Contract;
	let owner: Signer;
	let proposedOwner: Signer;
	let totalSupplyManager: Signer;

	before(async function () {
		const CroffleStableTokenV1 = await ethers.getContractFactory('CroffleStableTokenV1');
		token = await CroffleStableTokenV1.deploy();
		await token.deployed();

		owner = new ethers.Wallet(String(process.env.CONTRACT_OWNER_PRIVATE_KEY), ethers.provider);
		proposedOwner = new ethers.Wallet(String(process.env.CONTRACT_PROPOSED_OWNER_PRIVATE_KEY), ethers.provider);
		totalSupplyManager = new ethers.Wallet(String(process.env.CONTRACT_TOTALSUPPLY_MANAGER_PRIVATE_KEY), ethers.provider);
	});

	it('should have correct initial values', async () => {
		await token.initialized(process.env.CONTRACT_OWNER, process.env.CONTRACT_PROPOSED_OWNER, process.env.CONTRACT_TOTALSUPPLY_MANAGER);

		expect(await token.name()).to.equal('Croffle Stable Token');
		expect(await token.symbol()).to.equal('KRWT');
		expect(await token.decimals()).to.equal(18);
		expect(await token.totalSupply()).to.equal(0);
		expect(await token.contractOwner()).to.equal(await owner.getAddress());
		expect(await token.contractProposedOwner()).to.equal(await proposedOwner.getAddress());
		expect(await token.totalSupplyManager()).to.equal(await totalSupplyManager.getAddress());
		expect(await token.isPaused()).to.equal(false);
	});

	describe('TotalSupply', () => {
		it('should throw an error if caller is not the totalSupplyManager', async () => {
			await errException(token.connect(owner).increaseTotalSupply(ethers.utils.parseEther('10000')));
			await errException(token.connect(proposedOwner).decreaseTotalSupply(ethers.utils.parseEther('10000')));
			expect(await token.totalSupply()).to.equal('0');
		});

		it("should increase the token's total supply manager", async () => {
			await token.connect(totalSupplyManager).increaseTotalSupply(ethers.utils.parseEther('10000'));
			expect(await token.totalSupply()).to.equal(ethers.utils.parseEther('10000'));
			expect(await token.balanceOf(await totalSupplyManager.getAddress())).to.equal(ethers.utils.parseEther('10000'));
		});

		it("should increase the token's total supply manager", async () => {
			await token.connect(totalSupplyManager).decreaseTotalSupply(ethers.utils.parseEther('5000'));
			expect(await token.totalSupply()).to.equal(ethers.utils.parseEther('5000'));
			expect(await token.balanceOf(await totalSupplyManager.getAddress())).to.equal(ethers.utils.parseEther('5000'));
		});
	});

	describe('Pausable', () => {
		it('should pause the contract', async () => {
			await token.pause();
			expect(await token.isPaused()).to.be.true;

			await errException(token.connect(totalSupplyManager).transfer(await owner.getAddress(), ethers.utils.parseEther('1000')));
			expect(await token.balanceOf(await totalSupplyManager.getAddress())).to.equal(ethers.utils.parseEther('5000'));
		});

		it('should unpause the contract', async () => {
			await token.unpause();
			expect(await token.isPaused()).to.be.false;

			await token.connect(totalSupplyManager).transfer(await owner.getAddress(), ethers.utils.parseEther('1000'));
			await token.connect(totalSupplyManager).transfer(await proposedOwner.getAddress(), ethers.utils.parseEther('1000'));
			expect(await token.balanceOf(await totalSupplyManager.getAddress())).to.equal(ethers.utils.parseEther('3000'));
			expect(await token.balanceOf(await owner.getAddress())).to.equal(ethers.utils.parseEther('1000'));
			expect(await token.balanceOf(await proposedOwner.getAddress())).to.equal(ethers.utils.parseEther('1000'));
		});

		it('should revert when pausing an already paused contract', async () => {
			await token.pause();
			expect(token.pause()).to.be.revertedWith('CROFFLE : Contract is already paused');
		});

		it('should revert when unpausing a non-paused contract', async () => {
			await token.unpause();
			expect(token.unpause()).to.be.revertedWith('CROFFLE : Contract is not paused');
		});
	});

	describe('Lockup', () => {
		it('should freeze an account', async () => {
			await token.connect(owner).freezeAccount(await proposedOwner.getAddress());
			expect(await token.isUnFrozenAccount(await proposedOwner.getAddress())).to.be.true;

			await errException(token.connect(proposedOwner).transfer(await owner.getAddress(), ethers.utils.parseEther('1000')));
			expect(await token.balanceOf(await proposedOwner.getAddress())).to.equal(ethers.utils.parseEther('1000'));
		});

		it('should unfreeze an account', async () => {
			await token.connect(owner).unfreezeAccount(await proposedOwner.getAddress());
			expect(await token.isUnFrozenAccount(await proposedOwner.getAddress())).to.be.false;

			await token.connect(proposedOwner).transfer(await totalSupplyManager.getAddress(), ethers.utils.parseEther('500'));
			await token.connect(proposedOwner).transfer(await owner.getAddress(), ethers.utils.parseEther('500'));
			expect(await token.balanceOf(await totalSupplyManager.getAddress())).to.equal(ethers.utils.parseEther('3500'));
			expect(await token.balanceOf(await owner.getAddress())).to.equal(ethers.utils.parseEther('1500'));
			expect(await token.balanceOf(await proposedOwner.getAddress())).to.equal('0');
		});

		it('should revert when freezing an already frozen account', async () => {
			await token.connect(owner).freezeAccount(await proposedOwner.getAddress());
			expect(token.connect(owner).freezeAccount(await proposedOwner.getAddress())).to.be.revertedWith('CROFFLE : account is already frozen');
		});

		it('should revert when unfreezing a non-frozen account', async () => {
			await token.connect(owner).unfreezeAccount(await proposedOwner.getAddress());
			expect(token.unfreezeAccount(await proposedOwner.getAddress())).to.be.revertedWith('CROFFLE : account is not frozen');
		});

		it('should confiscate tokens from a frozen account', async () => {
			await token.connect(owner).transfer(await proposedOwner.getAddress(), ethers.utils.parseEther('1000'));
			expect(await token.balanceOf(await owner.getAddress())).to.equal(ethers.utils.parseEther('500'));
			expect(await token.balanceOf(await proposedOwner.getAddress())).to.equal(ethers.utils.parseEther('1000'));

			await token.connect(owner).freezeAccount(await proposedOwner.getAddress());
			expect(await token.isUnFrozenAccount(await proposedOwner.getAddress())).to.be.true;

			await token.connect(owner).confiscateTokens(proposedOwner.getAddress());
			expect(await token.balanceOf(await owner.getAddress())).to.equal(ethers.utils.parseEther('1500'));
			expect(await token.balanceOf(await proposedOwner.getAddress())).to.equal('0');
		});

		it('should revert when trying to confiscate tokens from a non-frozen account', async () => {
			await token.connect(owner).unfreezeAccount(await proposedOwner.getAddress());
			expect(await token.isUnFrozenAccount(await proposedOwner.getAddress())).to.be.false;
			expect(token.confiscateTokens(proposedOwner.getAddress())).to.be.revertedWith('CROFFLE : account is not frozen');
		});
	});

	describe('ERC20', () => {
		it('should transfer tokens from an approved spender', async () => {
			await token.connect(totalSupplyManager).approve(proposedOwner.getAddress(), ethers.utils.parseEther('1000'));
			expect(await token.allowance(await totalSupplyManager.getAddress(), await proposedOwner.getAddress())).to.equal(ethers.utils.parseEther('1000'));

			await token.connect(proposedOwner).transferFrom(await totalSupplyManager.getAddress(), await owner.getAddress(), ethers.utils.parseEther('1000'));
			expect(await token.balanceOf(await owner.getAddress())).to.equal(ethers.utils.parseEther('2500'));
			expect(await token.balanceOf(await totalSupplyManager.getAddress())).to.equal(ethers.utils.parseEther('2500'));
		});

		it("should revert if 'from' address is zero address during approval", async function () {
			expect(token.connect(ethers.constants.AddressZero).approve(await proposedOwner.getAddress(), ethers.utils.parseEther('1000'))).to.be.revertedWith('CROFFLE : approve from the zero address');
		});

		it("should revert if 'to' address is zero address during approval", async function () {
			expect(token.connect(await totalSupplyManager.getAddress()).approve(ethers.constants.AddressZero, ethers.utils.parseEther('1000'))).to.be.revertedWith('CROFFLE : approve to the zero address');
		});

		it('should increase the allowance of a spender', async () => {
			await token.connect(totalSupplyManager).approve(proposedOwner.getAddress(), ethers.utils.parseEther('500'));
			expect(await token.allowance(await totalSupplyManager.getAddress(), await proposedOwner.getAddress())).to.equal(ethers.utils.parseEther('500'));

			await token.connect(totalSupplyManager).increaseAllowance(proposedOwner.getAddress(), ethers.utils.parseEther('500'));
			expect(await token.allowance(await totalSupplyManager.getAddress(), await proposedOwner.getAddress())).to.equal(ethers.utils.parseEther('1000'));

			await token.connect(proposedOwner).transferFrom(await totalSupplyManager.getAddress(), await owner.getAddress(), ethers.utils.parseEther('1000'));
			expect(await token.balanceOf(await totalSupplyManager.getAddress())).to.equal(ethers.utils.parseEther('1500'));
			expect(await token.balanceOf(await owner.getAddress())).to.equal(ethers.utils.parseEther('3500'));
		});

		it('should decrease the allowance of a spender', async () => {
			await token.connect(totalSupplyManager).approve(proposedOwner.getAddress(), ethers.utils.parseEther('1500'));
			expect(await token.allowance(await totalSupplyManager.getAddress(), await proposedOwner.getAddress())).to.equal(ethers.utils.parseEther('1500'));

			await token.connect(totalSupplyManager).decreaseAllowance(proposedOwner.getAddress(), ethers.utils.parseEther('500'));
			expect(await token.allowance(await totalSupplyManager.getAddress(), await proposedOwner.getAddress())).to.equal(ethers.utils.parseEther('1000'));

			await token.connect(proposedOwner).transferFrom(await totalSupplyManager.getAddress(), await owner.getAddress(), ethers.utils.parseEther('1000'));
			expect(await token.balanceOf(await totalSupplyManager.getAddress())).to.equal(ethers.utils.parseEther('500'));
			expect(await token.balanceOf(await owner.getAddress())).to.equal(ethers.utils.parseEther('4500'));
		});

		it("should revert if owner's balance is insufficient for approval", async function () {
			expect(token.connect(totalSupplyManager).approve(proposedOwner.getAddress(), ethers.utils.parseEther('1000'))).to.be.revertedWith('CROFFLE : insufficient balance for approval');
		});

		it('should revert when transferring more tokens than the approve balance', async function () {
			await token.connect(totalSupplyManager).approve(proposedOwner.getAddress(), ethers.utils.parseEther('500'));
			expect(await token.allowance(await totalSupplyManager.getAddress(), await proposedOwner.getAddress())).to.equal(ethers.utils.parseEther('500'));
			expect(token.connect(proposedOwner).transferFrom(await totalSupplyManager.getAddress(), await owner.getAddress(), ethers.utils.parseEther('1000'))).to.be.revertedWith('CROFFLE : insufficient allowance');
		});

		it('should revert when transferring from/to the zero address', async function () {
			expect(token.connect(await totalSupplyManager.getAddress()).transfer(ethers.constants.AddressZero, ethers.utils.parseEther('500'))).to.be.revertedWith('CROFFLE : transfer to the zero address');
			expect(token.connect(await proposedOwner.getAddress()).transferFrom(await totalSupplyManager.getAddress(), ethers.constants.AddressZero, ethers.utils.parseEther('500'))).to.be.revertedWith('CROFFLE : transfer to the zero address');
		});
	});
});
