pragma solidity ^0.4.24;

import "../node_modules/zeppelin-solidity/contracts/access/rbac/RBAC.sol";
import "../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";

/**
  @title Administrated
  @dev This contract enables management of accounts with admin roles
  @dev Utilizes the Open Zeppelin Role Based Access Control (RBAC) Library
 */

contract Administrated is RBAC {
  /**
    @dev Event emitted when Admin Role is granted
   */
  event LogAdminAdded (
    address indexed account
  );

  /**
    @dev Event emitted when Admin Role is revoked
   */
  event LogAdminRemoved (
    address indexed account
  );

  /**
   * A constant role name for indicating admins.
   */
  string public constant ROLE_ADMIN = "admin";
  uint256 public numAdmins; //tracks the numbder of valid admins

  /**
   * @dev modifier to scope access to admins
   * // reverts
   */
  modifier onlyAdmin()
  {
    checkRole(msg.sender, ROLE_ADMIN);
    _;
  }

  /**
   * @dev modifier to scope access to non admins
   * // reverts
   */
  modifier notAdmin()
  {
    require(!hasRole(msg.sender, ROLE_ADMIN));
    _;
  }
  
  /**
   * @dev constructor
   * Assigns msg.sender (the deploying address) the Admin Role
   * must initialize the first admin and increment numAdmins in the constructor
   * because the addAdminRole() function is protected by the onlyAdmin modifier and 
   * thus can't be used to add the first admin
   */
  constructor()
    public
  {
    addRole(msg.sender, ROLE_ADMIN);
    numAdmins = 1;
  }

  /**
   * @dev add a role to an account
   * @param _account the account that will have the admin role
   */
  function addAdminRole(address _account)
    public
    onlyAdmin
  {
    require(!hasRole(_account, ROLE_ADMIN));
    addRole(_account, ROLE_ADMIN);
    numAdmins = SafeMath.add(numAdmins, 1);
    emit LogAdminAdded(_account);
  }

  /**
   * @dev remove a role from an account
   * @param _account the account that will no longer have the admin role
   */
  function removeAdminRole(address _account)
    public
    onlyAdmin
  {
    require(hasRole(_account, ROLE_ADMIN));
    removeRole(_account, ROLE_ADMIN);
    numAdmins = SafeMath.sub(numAdmins, 1);
    emit LogAdminRemoved(_account);
  }

  /**
    @dev returns true if _address has the admin role
    @param _address the address to test
   */
  function isAdmin(address _address) 
    public
    view
    returns(bool)
  {
    return hasRole(_address, ROLE_ADMIN);
  }

}