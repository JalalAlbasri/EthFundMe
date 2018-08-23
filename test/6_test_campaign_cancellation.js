/**
 * TEST #6: Test Campaign Cacellation
 *
 * In this test we test the Cancellation of a Campaign by the Campaign Manager
 *
 * We set up a fresh Campaign and some grant admin priviledges to some accounts
 * then approve it and make a contribution.
 *
 * First we test that we cannot cancel the campaign from a non authorized account.
 *
 * Next we cancel the camapign and ensure the Approval and Campaign States are set correctly.
 *
 * Next we try and wothdraw funds as a Campaign Manager and ensure that the Campaign Manager
 * Cannot withdraw funds from a cancelled campaign.
 *
 * Finally we ensure that contributors are able to withdraw funds from a cancelled campaign.
 *
 */

const CampaignFactory = artifacts.require('CampaignFactory')
const Campaign = artifacts.require('Campaign')
const ethjsAbi = require('ethereumjs-abi') // for soliditySha3 algo
const { assertRevert } = require('zeppelin-solidity/test/helpers/assertRevert')

contract('#6 Campaign Cancellation', (accounts) => {
  let CampaignFactoryInstance
  let CampaignInstance

  let salt = 123456789

  let voteOptionTrue = true
  let voteSecretTrue = '0x' + ethjsAbi.soliditySHA3(['bool', 'uint'], [voteOptionTrue, salt]).toString('hex')

  before('setup campaign, approve it and make a contribution', (done) => {
    CampaignFactory.deployed()
      .then((instance) => {
        CampaignFactoryInstance = instance
        return CampaignFactoryInstance.addAdminRole(accounts[1], { from: accounts[0] })
      })
      .then(() => {
        return CampaignFactoryInstance.addAdminRole(accounts[2], { from: accounts[1] })
      })
      .then(() => {
        return CampaignFactoryInstance.createCampaign(
          'test campaign',
          10,
          1,
          'test campaign description',
          'test image url',
          { from: accounts[3] }
        )
      })
      .then(() => {
        return CampaignFactoryInstance.campaigns.call(0)
      })
      .then((campaignAddress) => {
        CampaignInstance = Campaign.at(campaignAddress)
        return CampaignInstance.vote(voteSecretTrue, { from: accounts[0] })
      })
      .then(() => {
        return CampaignInstance.vote(voteSecretTrue, { from: accounts[1] })
      })
      .then(() => {
        return CampaignInstance.vote(voteSecretTrue, { from: accounts[2] })
      })
      .then(() => {
        return CampaignInstance.reveal(voteOptionTrue, salt, { from: accounts[0] })
      })
      .then(() => {
        return CampaignInstance.reveal(voteOptionTrue, salt, { from: accounts[1] })
      })
      .then(() => {
        return CampaignInstance.contribute({ from: accounts[4], value: 1 })
      })
      .then(() => {
        done()
      })
  })

  it('should attempt to cancel the campaign from a non authorized account and fail', (done) => {
    assertRevert(CampaignInstance.cancelCampaign({ from: accounts[4] })).then(() => {
      done()
    })
  })

  it('should not have cancelled the campaign', (done) => {
    CampaignInstance.campaignState.call().then((campaignState) => {
      assert.equal(campaignState, 1, 'campaignState should be 1 (Active)')
      done()
    })
  })

  it('should cancel the campaign', (done) => {
    CampaignInstance.cancelCampaign({ from: accounts[3] }).then(() => {
      done()
    })
  })

  it('should have set the campaign state to Cancelled', (done) => {
    CampaignInstance.campaignState.call().then((campaignState) => {
      assert.equal(campaignState, 4, 'campaignState should be 4 (Cancelled)')
      done()
    })
  })

  it('should should have set the approval state to Cancelled', (done) => {
    CampaignInstance.approvalState.call().then((approvalState) => {
      assert.equal(approvalState, 4, 'approvalState should be 4 (Cancelled)')
      done()
    })
  })

  it('should not allow the Campaign manager to withdraw funds', (done) => {
    assertRevert(CampaignInstance.withdraw({ from: accounts[3] })).then(() => {
      done()
    })
  })

  it('should not have withdrawn any funds', (done) => {
    CampaignInstance.funds.call().then((funds) => {
      assert.equal(funds, 1, 'funds should be 1')
      done()
    })
  })

  it('should allow contributors to withdraw contributed funds', (done) => {
    CampaignInstance.withdraw({ from: accounts[4] }).then(() => {
      done()
    })
  })

  it('should have debited funds correctly', (done) => {
    CampaignInstance.funds.call().then((funds) => {
      assert.equal(funds, 0, 'funds should be 0')
      done()
    })
  })
})
