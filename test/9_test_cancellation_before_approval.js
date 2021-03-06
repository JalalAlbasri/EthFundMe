/**
 * TEST #9: Test Campaign Cacellation Beore Approval
 *
 * In this test we test the Cancellation of a Campaign by the Campaign Manager before Approval
 *
 * We set up a fresh Campaign and some grant admin priviledges to some accounts
 *
 * We cancel the camapign and ensure the Approval and Campaign States are set correctly.
 *
 * We ensure that votes cannot be placed on a Cancelled Campaign.
 *
 */

const CampaignFactory = artifacts.require('CampaignFactory')
const Campaign = artifacts.require('Campaign')
const ethjsAbi = require('ethereumjs-abi') // for soliditySha3 algo
const { assertRevert } = require('zeppelin-solidity/test/helpers/assertRevert')
const expectEvent = require('zeppelin-solidity/test/helpers/expectEvent')

contract('#9 Campaign Cancellation Before Approval', (accounts) => {
  let CampaignFactoryInstance
  let CampaignInstance

  let salt = 123456789

  let voteOptionTrue = true
  let voteSecretTrue = '0x' + ethjsAbi.soliditySHA3(['bool', 'uint'], [voteOptionTrue, salt]).toString('hex')

  before('setup and reject campaign', (done) => {
    CampaignFactory.deployed()
      .then((instance) => {
        CampaignFactoryInstance = instance
        return expectEvent.inTransaction(
          CampaignFactoryInstance.addAdminRole(accounts[1], { from: accounts[0] }),
          'LogAdminAdded',
          { account: accounts[1] }
        )
      })
      .then(() => {
        return expectEvent.inTransaction(
          CampaignFactoryInstance.addAdminRole(accounts[2], { from: accounts[0] }),
          'LogAdminAdded',
          { account: accounts[2] }
        )
      })
      .then(() => {
        return expectEvent.inTransaction(
          CampaignFactoryInstance.createCampaign(
            'test campaign',
            10,
            1,
            'test campaign description',
            'test image url',
            { from: accounts[3] }
          ),
          'LogCampaignCreated'
        )
      })
      .then(() => {
        return CampaignFactoryInstance.campaigns.call(0)
      })
      .then((campaignAddress) => {
        CampaignInstance = Campaign.at(campaignAddress)
        return expectEvent.inTransaction(
          CampaignInstance.vote(voteSecretTrue, { from: accounts[0] }),
          'LogVoteComitted',
          {
            comittedBy: accounts[0]
          }
        )
      })
      .then(() => {
        done()
      })
  })

  it('should cancel the campaign and state should be set to Cancelled', async () => {
    await expectEvent.inTransaction(
      CampaignInstance.cancelCampaign({ from: accounts[3] }),
      'LogCampaignCancelled',
    )
  })

  it('should set campaign state to Cancelled', (done) => {
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

  it('should not allow Admin to vote on cancelled campaign', (done) => {
    assertRevert(CampaignInstance.vote(voteSecretTrue, { from: accounts[1] })).then(() => {
      done()
    })
  })

  it('should not have placed a vote', (done) => {
    CampaignInstance.numVoteSecrets.call().then((numVoteSecrets) => {
      assert.equal(numVoteSecrets, 1, 'numVotes should be 1')
      done()
    })
  })
})
