// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SafeMath
 * @dev This library used to prevent arithmetic errors such as overflow and underflow.
 */

library SafeMath {
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c - b == a, "SafeMath : add failed");

        return a + b;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "SafeMath : sub failed");
        uint256 c = a - b;

        return c;
    }

    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a * b;
        require(c / b == a, "SafeMath : mul failed");

        return c;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0, "SafeMath : div failed");

        return a / b;
    }
}

/**
 * @title Context
 * @dev Provides information about the current execution context, including the message sender.
 */

abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }
}

/**
 * @title Croffle Stable Token V1
 * @dev Implements the token standard with additional functionalities.
 */

contract CroffleStableTokenV1 is Context {
    using SafeMath for uint256;

    // * Initialization Settings
    bool private _initialized;

    // * Contract Pause Settings
    bool private _paused;

    // * Default Values
    string private constant _name = "Croffle Stable Token";
    string private constant _symbol = "KRWT";
    uint8 private constant _decimals = 18;
    uint256 private _totalSupply;

    // * Owner
    address private _contractOwner;

    // * Proposed Owner
    address private _proposedOwner;

    // * Total Supply Manager
    address private _totalSupplyManager;

    // * Transfer Event
    event Transfer(address indexed from, address indexed to, uint256 amount);

    // * Approval Event
    event Approval(address indexed owner, address indexed spender, uint256 amount);

    // * Owner Transfer Event
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    // * Proposed Owner Transfer Event
    event OwnershipTransferProposed(address indexed oldProposedOwner, address indexed newProposedOwner);

    // * Total Supply Manager Transfer Event
    event TotalSupplyManagerTransferred(address indexed oldTotalSupplyManager, address indexed newTotalSupplyManager);

    // * Total Supply Increase Event
    event TotalSupplyIncrease(address indexed totalSupplyManager, uint256 newTotalSupply);

    // * Total Supply Decrease Event
    event TotalSupplyDecrease(address indexed totalSupplyManager, uint256 newTotalSupply);

    // * Contract Pause Event
    event Paused(address owner, uint256 timestamp);

    // * Contract Unpause Event
    event Unpaused(address owner, uint256 timestamp);

    // * Account Freeze Event
    event FrozenAccount(address indexed account, uint256 lockTime);

    // * Account Unfreeze Event
    event UnfrozenAccount(address indexed account, uint256 lockTime);

    // * Confiscation of Tokens Event
    event TokensConfiscated(address indexed account, uint256 confiscatedAmount);

    // * Balance Mapping
    mapping(address => uint256) internal _balances;

    // * Allowance Mapping
    mapping(address => mapping(address => uint256)) private _allowances;

    // * Account Freezing Mapping
    mapping(address => bool) private _frozenAccounts;

    // * Owner Function Modifier
    modifier onlyOwner() {
        _isOwner();
        _;
    }

    // * Proposed Owner Function Modifier
    modifier onlyProposedOwner() {
        _isOwner();
        _;
    }

    // * Total Supply Manager Function Modifier
    modifier onlyTotalSupplyManager() {
        _isTotalSupplyManager();
        _;
    }

    // * Contract Pause Function Modifier
    modifier whenNotPaused() {
        require(!isPaused(), "CROFFLE : contract is paused");
        _;
    }

    // * Contract Initialization Function
    function initialized(address initial_contractOwner, address initial_proposedOwner, address initial_totalSupplyManager) public {
        require(!_initialized, "CROFFLE : contract instance has already been initialized");
        _initialized = true;

        _paused = false;
        _totalSupply = 0;
        _contractOwner = initial_contractOwner;
        _proposedOwner = initial_proposedOwner;
        _totalSupplyManager = initial_totalSupplyManager;
    }

    // * Default Functions
    function name() public view virtual returns(string memory) {
        return _name;
    }

    function symbol() public view virtual returns(string memory) {
        return _symbol;
    }

    function decimals() public view virtual returns(uint8) {
        return _decimals;
    }

    function totalSupply() public view virtual returns(uint256) {
        return _totalSupply;
    }

    function balanceOf(address _address) public view virtual returns(uint256) {
        return _balances[_address];
    }

    function transfer(address _to, uint256 _amount) public virtual whenNotPaused {
        address owner = _msgSender();
        _transfer(owner, _to, _amount);
    }

    function approve(address _spender, uint256 _amount) public virtual whenNotPaused {
        address owner = _msgSender();
        _approve(owner, _spender, _amount);
    }

    function allowance(address _owner, address _spender) public view virtual returns(uint256) {
        return _allowances[_owner][_spender];
    }

    function transferFrom(address _from, address _to, uint256 _amount) public virtual whenNotPaused {
        address spender = _msgSender();
        _spendAllowance(_from, spender, _amount);
        _transfer(_from, _to, _amount);
    }

    function increaseAllowance(address _spender, uint256 _amount) public virtual whenNotPaused {
        address owner = _msgSender();
        _approve(owner, _spender, allowance(owner, _spender).add(_amount));
    }

    function decreaseAllowance(address _spender, uint256 _amount) public virtual whenNotPaused {
        address owner = _msgSender();
        require(allowance(owner, _spender) >= _amount, "CROFFLE : insufficient allowance");
        unchecked {
            _approve(owner, _spender, allowance(owner, _spender).sub(_amount));
        }
    }

    function _transfer(address from, address to, uint256 amount) internal virtual {
        _beforeTokenTransfer(from, to);

        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "CROFFLE : transfer amount exceeds balance");

        unchecked {
            _balances[from] = fromBalance.sub(amount);
            _balances[to] = _balances[to].add(amount);
        }

        _afterTokenTransfer(from, to, amount);
    }

    function _beforeTokenTransfer(address from, address to) internal virtual {
        require(from != address(0), "CROFFLE : transfer from the zero address");
        require(to != address(0), "CROFFLE : transfer to the zero address");
        require(!isUnFrozenAccount(from), "CROFFLE : from account is frozen, transfer is not allowed");
        require(!isUnFrozenAccount(to), "CROFFLE : to account is frozen, transfer is not allowed");
    }
    
    function _afterTokenTransfer(address from, address to, uint256 amount) internal virtual {
        emit Transfer(from, to, amount);
    }

    function _approve(address owner, address spender, uint256 amount) internal virtual {
        require(owner != address(0), "CROFFLE : approve from the zero address");
        require(spender != address(0), "CROFFLE : approve to the zero address");
        require(balanceOf(owner) >= amount, "CROFFLE : insufficient balance for approval");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _spendAllowance(address owner, address spender, uint256 amount) internal virtual {
        uint256 currentAllowance = allowance(owner, spender);
        require(currentAllowance != type(uint256).max, "CROFFLE : Allowance limit reached.");
        require(currentAllowance >= amount, "CROFFLE : insufficient allowance");
        unchecked {
            _approve(owner, spender, currentAllowance.sub(amount));
        }
    }

    // * Owner Management
    // Get the contract owner
    function contractOwner() public view virtual returns(address) {
        return _contractOwner;
    }

    // Get the proposed owner
    function contractProposedOwner() public view virtual returns(address) {
        return _proposedOwner;
    }

    // Check if the caller is the owner
    function _isOwner() internal virtual {
        require(contractOwner() == _msgSender(), "CROFFLE : caller is not owner");
    }

    // Check if the caller is the proposed owner
    function _isProposedOwner() internal virtual {
        require(contractProposedOwner() == _msgSender(), "CROFFLE : caller is not proposedOwner");
    }

    // Confirm the new owner
    function confirmOwner() public virtual onlyOwner {
        require(_proposedOwner != address(0), "CROFFLE : no proposed owner to confirm");

        address oldOwner = contractOwner();
        _contractOwner = _proposedOwner;
        _proposedOwner = address(0);
        emit OwnershipTransferred(oldOwner, _proposedOwner);
    }

    // Propose a new owner
    function proposeOwner(address _newProposedOwner) public virtual onlyOwner {
        require(_newProposedOwner != address(0), "CROFFLE : cannot transfer ownership to address zero");
        require(_newProposedOwner != contractProposedOwner(), "CROFFLE : account is already proposedOwner");
        require(_newProposedOwner != contractOwner(), "CROFFLE : account is already owner");
        require(_newProposedOwner != totalSupplyManager(), "CROFFLE : account is already totalSupplyManager");

        address oldProposedOwner = _proposedOwner;
        _proposedOwner = _newProposedOwner;
        emit TotalSupplyManagerTransferred(oldProposedOwner, _newProposedOwner);
    }

    // Cancel the proposed owner
    function cancelOwnerTransfer() public virtual onlyOwner {
        require(_proposedOwner != address(0), "CROFFLE : no proposed owner to confirm");
        _proposedOwner = address(0);
    }

    // * Total Supply Management
    // Get the total supply manager
    function totalSupplyManager() public view virtual returns(address) {
        return _totalSupplyManager;
    }

    // Check if the caller is the total supply manager
    function _isTotalSupplyManager() internal view virtual {
        require(totalSupplyManager() == _msgSender(), "CROFFLE : caller is not the totalSupplyManager");
    }

    // Set a new total supply manager
    function setTotalSupplyManager(address _newTotalSupplyManager) public virtual onlyTotalSupplyManager {
        require(_newTotalSupplyManager != address(0), "CROFFLE : cannot transfer totalSupplyManger authority to address zero");
        require(_newTotalSupplyManager != contractProposedOwner(), "CROFFLE : account is already proposedOwner");
        require(_newTotalSupplyManager != contractOwner(), "CROFFLE : account is already owner");
        require(_newTotalSupplyManager != totalSupplyManager(), "CROFFLE : account is already totalSupplyManager");

        address oldTotalSupplyManager = _totalSupplyManager;
        _totalSupplyManager = _newTotalSupplyManager;
        emit TotalSupplyManagerTransferred(oldTotalSupplyManager, _newTotalSupplyManager);
    }

    // Increase the total supply
    function increaseTotalSupply(uint256 _amount) public virtual onlyTotalSupplyManager whenNotPaused {
        _totalSupply = totalSupply().add(_amount);
        _balances[_totalSupplyManager] = _balances[_totalSupplyManager].add(_amount);

        emit TotalSupplyIncrease(_totalSupplyManager, _totalSupply);
        emit Transfer(address(0), _totalSupplyManager, _totalSupply);
    }

    // Decrease the total supply
    function decreaseTotalSupply(uint256 _amount) public virtual onlyTotalSupplyManager whenNotPaused {
        require(_amount <= _balances[_totalSupplyManager], "CROFFLE : not enough totalSupplyManager balance");

        _balances[_totalSupplyManager] = _balances[_totalSupplyManager].sub(_amount);
        _totalSupply = _totalSupply.sub(_amount);

        emit TotalSupplyDecrease(_totalSupplyManager, _amount);
        emit Transfer(_totalSupplyManager, address(0), _amount);
    }

    // * Contract Pausable Management
    // Pause the contract
    function pause() public virtual onlyOwner {
        require(!_paused, "CROFFLE : Contract is already paused");
        _paused = true;
        emit Paused(contractOwner(), block.timestamp);
    }

    // Unpause the contract
    function unpause() public virtual onlyOwner {
        require(_paused, "CROFFLE : Contract is not paused");
        _paused = false;
        emit Paused(contractOwner(), block.timestamp);
    }

    // Check if the contract is paused
    function isPaused() public view virtual returns(bool) {
        return _paused;
    }

    // * Account Lock Management
    // Freeze an account
    function freezeAccount(address _account) public virtual onlyOwner {
        require(!_frozenAccounts[_account], "CROFFLE : account is already frozen");

        _frozenAccounts[_account] = true;

        emit FrozenAccount(_account, block.timestamp);
    }

    // Unfreeze an account
    function unfreezeAccount(address _account) public virtual onlyOwner {
        require(_frozenAccounts[_account], "CROFFLE : account is not frozen");

        _frozenAccounts[_account] = false;

        emit FrozenAccount(_account, block.timestamp);
    }

    // Confiscate tokens from a suspended account
    function confiscateTokens(address _account) public virtual onlyOwner {
        require(_frozenAccounts[_account], "CROFFLE : account is not frozen");

        uint256 confiscatedAmount = _balances[_account];
        _balances[_account] = 0;
        _balances[contractOwner()] = _balances[contractOwner()].add(confiscatedAmount);

        emit TokensConfiscated(_account, confiscatedAmount);
    }

    // Check if an account is unfrozen    
    function isUnFrozenAccount(address _account) public view virtual returns(bool) {
        return _frozenAccounts[_account];
    }
}
