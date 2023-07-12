## Croffle Stable Token V1

Croffle Stable Token V1 is an ERC-20 compatible stable token smart contract implemented in Solidity. It provides additional functionalities such as ownership management, total supply management, contract pausing, account freezing, and token confiscation.

### Features

**Token Standard**: Croffle Stable Token V1 implements the ERC-20 token standard, allowing seamless integration with other decentralized applications (dApps) and exchanges.

**SafeMath Library**: The contract utilizes the SafeMath library to prevent arithmetic errors such as overflow and underflow, ensuring the safety of token transfers and calculations.

**Initialization**: The contract includes an initialization function that sets the initial contract owner, proposed owner, and total supply manager. This function can only be called once to initialize the contract.

**Owner Management**: The contract includes functions to manage the contract owner. The owner can transfer ownership to a proposed owner and confirm the ownership transfer. Only the owner can perform these actions.

**Total Supply Management**: The contract allows for the management of the total token supply. The total supply manager can be set to a new address, and the total supply can be increased or decreased. Only the total supply manager can perform these actions.

**Contract Pausing**: The contract can be paused and unpaused by the contract owner. When paused, token transfers and other functions are disabled, providing an emergency stop mechanism.

**Account Freezing**: The contract supports freezing and unfreezing of accounts. When an account is frozen, token transfers are not allowed for that account. Only the contract owner can freeze or unfreeze accounts.

**Token Confiscation**: The contract allows for the confiscation of tokens from frozen accounts. Confiscated tokens are transferred to the contract owner's account.

**Proxy Upgrade**: Croffle Stable Token V1 provides upgradeability through the proxy upgrade pattern. By using upgradeable contract proxies, new logic can be deployed and connected without modifying the existing contract.

The advantages of proxy upgrade are as follows:

- Existing users can access new features through interaction with the proxy.

- Existing token balances and history are preserved during the deployment and connection of new logic.

- Security patches and feature upgrades can be easily performed.

- Deployment costs and user migration costs can be reduced.

To enable proxy upgrade, the `deployProxy` function from the upgrades library in Hardhat is used. This function allows deploying and upgrading the Croffle Stable Token V1 contract.

if you want to learn more about proxy upgrades, please refer to the following resources

https://www.quicknode.com/guides/ethereum-development/smart-contracts/how-to-create-and-deploy-an-upgradeable-smart-contract-using-openzeppelin-and-hardhat

### License

This project is licensed under the MIT License. See the LICENSE file for details.