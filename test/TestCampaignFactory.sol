/**
 * TEST #0 : Test Campaign Factort
 *
 * In This test we test Initialization of the CampaignFactory and
 * The functionality of the Administrated Contract.
 *
 * The Administrated Contract manages Admins and granting/revoking
 * admin priviledges.
 *
 * We test that the contract CampaignFactory is initialized with a
 * single admin.
 *
 * We test Campaign Creation and Campaign Cancellation by the Campaign Manager
 *
 */

pragma solidity ^0.4.24;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/CampaignFactory.sol";
import "../contracts/Administrated.sol";
import "../contracts/Campaign.sol";

contract TestCampaignFactory {
  CampaignFactory campaignFactory = CampaignFactory(DeployedAddresses.CampaignFactory());
  address campaignAddress;

  function testInitialNumAdmins() public {
    Assert.equal(campaignFactory.numAdmins(), 1, "There should be one admin");
  }

  function testIsAdmin() public {
    Assert.equal(campaignFactory.isAdmin(msg.sender), true, "Account should be an admin");
  }

  function testIsNotAdmin() public {
    Assert.equal(campaignFactory.isAdmin(address(this)), false, "Test Contract should not be an admin");
  }

  function testCampaignCreation() public {
    campaignAddress = campaignFactory.createCampaign("test", 10, 1, "test description", "test image");
    Assert.equal(campaignFactory.getNumCampaigns(), 1, "There should be one campaign created by the test contract");
  }

  /**
    Due to solidity testing limitations msg.sender address cannot be changed;
    We cannot make calls to the contract from an admin account or another account
    as a contributor.

    The Test contract created a Campaign that will remain in Pending state.
    The only possible interaction from the Campaign Manager is to now cancel the
    Campaign.
   */
  function testCampaignCancellation() public {
    Campaign campaign = Campaign(campaignAddress);
    campaign.cancelCampaign();
    Assert.equal(campaign.getCampaignState(), 4, "Campaign State should be 4 (Cancelled)");
  }

}