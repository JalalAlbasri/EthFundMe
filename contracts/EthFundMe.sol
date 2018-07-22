pragma solidity ^0.4.24;

// import "./Approvable.sol";
import "./Campaign.sol";

// TASK: Timing campaigns
// TASK: Ending Campaign and Payouts
// TASK: Adding Admin
// TASK: Approval Quorum Support Adding Admin
// TASK: Timing Approvals
// TASK: Manager can cancel Campaign before approved
// TASK: Events + Listening for them
// TASK: Comment Contracts and Tests
// TASK: Review All variable/function etc Names
// TASK: Review All variable/function etc accessibility
// TASK: Write Solidity Tests
// TASK: Frontend
// TASK: Packaging and Other Documentation
// TASK: Review uints and restrict size if possible

// TASK: Full PLCR Approval
// TASK: Other Stretch Goals
// TASK: ERC20 Token Acceptance

contract EthFundMe {

  /**
    ADMINS
   */
  address[] public admins;
  mapping (address=> bool) public isAdmin;

  // TODO: Adding an
  /**
    Allows initialization of the contract with up to 3 admins
   */
  constructor(address[] _admins) public {
    //FIXME: Can I put a require statement in a contructor? What happens if it fails?
    require(_admins.length <= 3);
    
    admins = _admins;
    for (uint i = 0; i < admins.length; i++) {
      isAdmin[admins[i]] = true;
    }
  }

  function getNumAdmins() public view returns (uint) {
    return admins.length;
  }

  /**
    CAMPAIGNS
  */
  address[] public campaigns;

  function getNumCampaigns() public view returns (uint) {
    return campaigns.length;
  }

  function createCampaign(string title, uint goal, uint duration) public returns(address) {
    Campaign newCampaign = new Campaign(campaigns.length, title, goal, duration, msg.sender, address(this));
    campaigns.push(address(newCampaign));
    return address(newCampaign);
  }


}

