/**
 * TEST #7: Test Campaign End Successfully.
 *
 * In this test we test a Campaign Ending in a Successful State.
 * The Campaign will end successfully when it reaches the end date and
 * the funds raised are greater than the funding goal specified by the campaign manager.
 *
 * We use the 'increaseTime' test helper library from Open Zeppelin to increase EVM Time to simulate
 * time passing past the Campaign End Date.
 * (https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/test/helpers/increaseTime.js)
 *
 * We set up a fresh Campaign and some grant admin priviledges to some accounts
 * then approve it and make some contributions.
 *
 * We verify the campaign state and attempt to end the Campaign before the end date and ensure that
 * the operation reverts.
 *
 * We then increase the EVM time by 2 days past the Campaign duration of 1 day. The Campaign should be 'endable' now
 *
 * Before ending the campaign we double check out access restriction and attempt to end the campaign from and un authorized
 * campaign and fail.
 *
 * We end the Campaign and check the Campaign State changed accordingly.
 *
 * We ensure that Campaign contributors are not allowed to withdraw funds and that only the Campaign Manager is allowed to withdraw
 * from the Campaign.
 *
 * We withdraw funds and check that state variables are updated correctly.
 *
 */

const CampaignFactory = artifacts.require('CampaignFactory')
const Campaign = artifacts.require('Campaign')
const ethjsAbi = require('ethereumjs-abi') // for soliditySha3 algo
const { assertRevert } = require('zeppelin-solidity/test/helpers/assertRevert')
const expectEvent = require('zeppelin-solidity/test/helpers/expectEvent')

const { increaseTime } = require('zeppelin-solidity/test/helpers/increaseTime')

const TWO_DAYS = 2 * 24 * 60 * 60

contract('#7 Campaign End Successfully', (accounts) => {
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
        return expectEvent.inTransaction(
          CampaignInstance.vote(voteSecretTrue, { from: accounts[1] }),
          'LogVoteComitted',
          {
            comittedBy: accounts[1]
          }
        )
      })
      .then(() => {
        return expectEvent.inTransaction(
          CampaignInstance.vote(voteSecretTrue, { from: accounts[2] }),
          'LogVoteComitted',
          {
            comittedBy: accounts[2]
          }
        )
      })
      .then(() => {
        return expectEvent.inTransaction(
          CampaignInstance.reveal(voteOptionTrue, salt, { from: accounts[0] }),
          'LogVoteRevealed',
          {
            revealedBy: accounts[0]
          }
        )
      })
      .then(() => {
        return expectEvent.inTransaction(
          CampaignInstance.reveal(voteOptionTrue, salt, { from: accounts[1] }),
          'LogVoteRevealed',
          {
            revealedBy: accounts[1]
          }
        )
      })
      .then(() => {
        return expectEvent.inTransaction(
          CampaignInstance.contribute({ from: accounts[4], value: 5 }),
          'LogContributionMade',
          {
            contributor: accounts[4]
          }
        )
      })
      .then(() => {
        return expectEvent.inTransaction(
          CampaignInstance.contribute({ from: accounts[5], value: 2 }),
          'LogContributionMade',
          {
            contributor: accounts[5]
          }
        )
      })
      .then(() => {
        return expectEvent.inTransaction(
          CampaignInstance.contribute({ from: accounts[5], value: 3 }),
          'LogContributionMade',
          {
            contributor: accounts[5]
          }
        )
      })
      .then(() => {
        return expectEvent.inTransaction(
          CampaignInstance.contribute({ from: accounts[6], value: 3 }),
          'LogContributionMade',
          {
            contributor: accounts[6]
          }
        )
      })
      .then(() => {
        done()
      })
  })

  it('should end campaign before end date and fail', (done) => {
    assertRevert(CampaignInstance.endCampaign({ from: accounts[3] })).then(() => {
      done()
    })
  })

  it('should set campaign state to Active', (done) => {
    CampaignInstance.campaignState.call().then((campaignState) => {
      assert.equal(campaignState, 1, 'campaignState should be 1 (Active)')
      done()
    })
  })

  // time travel
  it('should increase evm time past end date', async () => {
    await increaseTime(TWO_DAYS)
  })

  it('should attempt to end campaign from invalid account and fail', (done) => {
    assertRevert(CampaignInstance.endCampaign({ from: accounts[4] })).then(() => {
      done()
    })
  })

  it('should not have changed approval state', (done) => {
    CampaignInstance.campaignState.call().then((campaignState) => {
      assert.equal(campaignState, 1, 'approvalState should be 1 (Active)')
      done()
    })
  })

  it('should end campaign', async () => {
    await expectEvent.inTransaction(
      CampaignInstance.endCampaign({ from: accounts[3] }),
      'LogCampaignEnded',
      {
        isSuccessful: true
      }
    )
  })

  it('Camapaign state should be set to Successful', (done) => {
    CampaignInstance.campaignState.call().then((campaignState) => {
      assert.equal(campaignState, 2, 'campaignState should be 2 (Successful)')
      done()
    })
  })

  it('should not allow the contributors to withdraw funds', (done) => {
    assertRevert(CampaignInstance.withdraw({ fron: accounts[4] })).then(() => {
      done()
    })
  })

  it('should not have withdrawn any funds', (done) => {
    CampaignInstance.funds.call().then((funds) => {
      assert.equal(funds, 13, 'funds should be 13')
      done()
    })
  })

  it('should allow Cmapaign manager to withdraw funds', async () => {
    await expectEvent.inTransaction(
      CampaignInstance.withdraw({ from: accounts[3] }),
      'LogWithdrawlMade',
      {
        beneficiary: accounts[3]
      }
    )
  })

  it('should have debited funds correctly', (done) => {
    CampaignInstance.funds.call().then((funds) => {
      assert.equal(funds, 0, 'funds should be 0')
      done()
    })
  })
})
