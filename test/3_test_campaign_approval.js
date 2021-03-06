/**
 * TEST #3: Test Campaign Approval
 *
 * In this test we test Campaign Approval by admins
 *
 * We set up a fresh Campaign and some grant admin priviledges to some accounts.
 * We check that the Campaign is created with the correct approval state to Commit then
 * place votes from admins to approve the Campaign.
 *
 * We test that state variables are set correctly when votes and placed and ensure that only
 * autorized accounts are able to place votes.
 *
 * We also check that votes can be changed as long as we are still in the Commit Phase.
 *
 * We also check the votes cannot be revealed before the Campaign is out of the Commit stage.
 *
 * Once all votes are in we check that the state transitions correctly to Reveal
 *
 * We ensure that no votes can be placed now that we are in the Reveal phase and that votes cannot
 * be revealed by unauthorized accounts.
 *
 * We ensure that revealing a vote fails if the wrong vote option or salt is used. The Option and salt
 * must be the same as those used when encrypting the vote secret.
 *
 * We enure that votes can only be once by each voter and votes are not double counted.
 *
 * We continue to reveal the remaining votes but also check that contributions cannot be placed before all
 * the votes are revealed and the campaign state is transitioned.
 *
 * Once enough votes are revealed we ensure that the Approval state is transitioned to Approved and
 * the Campaign State is transitioned to Active.
 *
 */
const CampaignFactory = artifacts.require('CampaignFactory')
const Campaign = artifacts.require('Campaign')
const ethjsAbi = require('ethereumjs-abi') // for soliditySha3 algo
const { assertRevert } = require('zeppelin-solidity/test/helpers/assertRevert')
const expectEvent = require('zeppelin-solidity/test/helpers/expectEvent')

contract('#3 Campaign Approval', (accounts) => {
  let CampaignFactoryInstance
  let CampaignInstance

  let salt = 123456789

  let originalVoteOption0 = true
  let newVoteOption0 = false

  let voteOption1 = true
  let voteOption2 = true

  let originalVoteSecret0 = '0x' + ethjsAbi.soliditySHA3(['bool', 'uint'], [originalVoteOption0, salt]).toString('hex')
  let newVoteSecret0 = '0x' + ethjsAbi.soliditySHA3(['bool', 'uint'], [newVoteOption0, salt]).toString('hex')

  let voteSecret1 = '0x' + ethjsAbi.soliditySHA3(['bool', 'uint'], [voteOption1, salt]).toString('hex')
  let voteSecret2 = '0x' + ethjsAbi.soliditySHA3(['bool', 'uint'], [voteOption2, salt]).toString('hex')

  before('set up contract instances', async () => {
    CampaignFactoryInstance = await CampaignFactory.deployed()

    await expectEvent.inTransaction(
      CampaignFactoryInstance.addAdminRole(accounts[1], { from: accounts[0] }),
      'LogAdminAdded',
      { account: accounts[1] }
    )

    await expectEvent.inTransaction(
      CampaignFactoryInstance.addAdminRole(accounts[2], { from: accounts[0] }),
      'LogAdminAdded',
      { account: accounts[2] }
    )

    const event = await expectEvent.inTransaction(
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

    const campaignAddress = event.args.campaignAddress

    CampaignInstance = Campaign.at(campaignAddress)
  })

  it('should set approval state correctly to Commit', async () => {
    const approvalState = await CampaignInstance.approvalState.call({ from: accounts[0] })
    assert.equal(approvalState, 0, 'approvalState should be 0 (Commit)')
  })

  it('should place a vote from accounts[0]', async () => {
    await expectEvent.inTransaction(
      CampaignInstance.vote(originalVoteSecret0, { from: accounts[0] }),
      'LogVoteComitted',
      {
        comittedBy: accounts[0]
      }
    )
  })

  it('should have set the voteSecret correctly for accounts[0]', async () => {
    const voteSecret = await CampaignInstance.voteSecrets.call(accounts[0])
    assert.equal(voteSecret, originalVoteSecret0, 'voteSecrets should match')
  })

  it('should set numVoteSecrets correctly', async () => {
    const numVoteSecrets = await CampaignInstance.numVoteSecrets.call()
    assert.equal(numVoteSecrets, 1, 'there should be one vote')
  })

  it('should attempt to place vote from non admin account and fail', async () => {
    await assertRevert(CampaignInstance.vote(originalVoteSecret0, { from: accounts[4] }))
  })

  it('should not have placed a vote', async () => {
    const numVoteSecrets = await CampaignInstance.numVoteSecrets.call()
    assert.equal(numVoteSecrets, 1, 'there should be one vote')
  })

  it('should change a vote from accounts[0]', async () => {
    await expectEvent.inTransaction(
      CampaignInstance.vote(newVoteSecret0, { from: accounts[0] }),
      'LogVoteComitted',
      {
        comittedBy: accounts[0]
      }
    )
  })

  it('should have set the voteSecret correctly for accounts[0]', async () => {
    const voteSecret = await CampaignInstance.voteSecrets.call(accounts[0])
    assert.equal(voteSecret, newVoteSecret0, 'voteSecrets should match')
  })

  it("should have changed accounts[0]'s vote", async () => {
    const voteSecret = await CampaignInstance.voteSecrets.call(accounts[0])
    assert.equal(voteSecret, newVoteSecret0, 'voteSecret should match newVoteSecret0')
  })

  // verify there is still only one vote after changing the vote
  it('should set numVoteSecrets correctly', async () => {
    const numVoteSecrets = await CampaignInstance.numVoteSecrets.call()
    assert.equal(numVoteSecrets, 1, 'there should be one vote')
  })

  it('should attempt to reveal a vote and fail (cannot reveal during Commit state)', async () => {
    await assertRevert(CampaignInstance.reveal(newVoteOption0, salt, { from: accounts[0] }))
  })

  it('should not have revealed a vote', async () => {
    const numVoteReveals = await CampaignInstance.numVoteReveals.call()
    assert.equal(numVoteReveals, 0, 'there should be no reveals')
  })

  it('should place a vote from accounts[1]', async () => {
    await expectEvent.inTransaction(
      CampaignInstance.vote(voteSecret1, { from: accounts[1] }),
      'LogVoteComitted',
      {
        comittedBy: accounts[1]
      }
    )
  })

  it('should have set the voteSecret correctly for accounts[1]', async () => {
    const voteSecret = await CampaignInstance.voteSecrets.call(accounts[1])
    assert.equal(voteSecret, voteSecret1, 'voteSecrets should match')
  })

  it('should place a vote from accounts[2]', async () => {
    await expectEvent.inTransaction(
      CampaignInstance.vote(voteSecret2, { from: accounts[2] }),
      'LogVoteComitted',
      {
        comittedBy: accounts[2]
      }
    )
  })

  it('should have set the voteSecret correctly for accounts[2]', async () => {
    const voteSecret = await CampaignInstance.voteSecrets.call(accounts[2])
    assert.equal(voteSecret, voteSecret2, 'voteSecrets should match')
  })

  it('should set numVoteSecrets correctly', async () => {
    const numVoteSecrets = await CampaignInstance.numVoteSecrets.call()
    assert.equal(Number(numVoteSecrets), 3, 'there should be 3 votes')
  })

  it('should set approval state correctly to Reveal', async () => {
    const approvalState = await CampaignInstance.approvalState.call()
    assert.equal(approvalState, 1, 'approvalState should be 1 (Reveal)')
  })

  it('should attempt to place a vote and fail (cannot vote during Reveal state)', async () => {
    await assertRevert(CampaignInstance.vote(originalVoteSecret0, { from: accounts[0] }))
  })

  it('should not have placed a vote', async () => {
    const numVoteSecrets = await CampaignInstance.numVoteSecrets.call()
    assert.equal(numVoteSecrets, 3, 'there should be 3 votes')
  })

  it('should attempt to reveal a vote for accounts[0] with wrong salt and fail', async () => {
    await assertRevert(CampaignInstance.reveal(newVoteOption0, 0, { from: accounts[0] }))
  })

  it('should attempt to reveal a vote for accounts[0] with wrong voteOption and fail', async () => {
    await assertRevert(CampaignInstance.reveal(true, salt, { from: accounts[0] }))
  })

  it('should attempt to reveal a vote for from non admin account and fail', async () => {
    await assertRevert(CampaignInstance.reveal(newVoteOption0, salt, { from: accounts[4] }))
  })

  it('should not have revealed a vote', async () => {
    const numVoteReveals = await CampaignInstance.numVoteReveals.call()
    assert.equal(numVoteReveals, 0, 'there should be no reveals')
  })

  it('should reveal vote for accounts[0]', async () => {
    await expectEvent.inTransaction(
      CampaignInstance.reveal(newVoteOption0, salt, { from: accounts[0] }),
      'LogVoteRevealed',
      {
        revealedBy: accounts[0]
      }
    )
  })

  it('should have revealed one vote', async () => {
    const numVoteReveals = await CampaignInstance.numVoteReveals.call()
    assert.equal(numVoteReveals, 1, 'there should 1 reveal')
  })

  it('should set hasRevealed correctly', async () => {
    const hasRevealed = await CampaignInstance.hasRevealed.call(accounts[0])
    assert.equal(hasRevealed, true, 'hasRevealed should be true')
  })

  it('should set numRejections correctly', async () => {
    const numRejections = await CampaignInstance.numRejections.call()
    assert.equal(numRejections, 1, 'numRejections should be 1')
  })

  it('should attempt to reveal a vote for from accounts[0] again and fail', async () => {
    await assertRevert(CampaignInstance.reveal(newVoteOption0, salt, { from: accounts[0] }))
  })

  it('should not have revealed the vote again', async () => {
    const numVoteReveals = await CampaignInstance.numVoteReveals.call()
    assert.equal(numVoteReveals, 1, 'there should 1 reveal')
  })

  it('should reveal vote for accounts[1]', async () => {
    await expectEvent.inTransaction(
      CampaignInstance.reveal(voteOption1, salt, { from: accounts[1] }),
      'LogVoteRevealed',
      {
        revealedBy: accounts[1]
      }
    )
  })

  it('should have revealed a second vote', async () => {
    const numVoteReveals = await CampaignInstance.numVoteReveals.call()
    assert.equal(numVoteReveals, 2, 'there should 2 reveals')
  })

  it('should attempt to make a contribution and fail (cannot contribute approval state pending)', async () => {
    await assertRevert(CampaignInstance.contribute({ from: accounts[4], value: 1 }))
  })

  it('should not have contributed any funds', async () => {
    const funds = await CampaignInstance.funds.call()
    assert.equal(funds, 0, 'no funds should have been contributed')
  })

  it('should reveal vote for accounts[2]', async () => {
    await expectEvent.inTransaction(
      CampaignInstance.reveal(voteOption2, salt, { from: accounts[2] }),
      'LogVoteRevealed',
      {
        revealedBy: accounts[2]
      }
    )
  })

  it('should have revealed a third vote', async () => {
    const numVoteReveals = await CampaignInstance.numVoteReveals.call()
    assert.equal(numVoteReveals, 3, 'there should 3 reveals')
  })

  it('should set approval state correctly to Approved', async () => {
    const approvalState = await CampaignInstance.approvalState.call()
    assert.equal(approvalState, 2, 'approvalState should be 2 (Approved)')
  })

  it('should set campaign state correctly to Active', async () => {
    const campaignState = await CampaignInstance.campaignState.call()
    assert.equal(campaignState, 1, 'approvalState should be 1 (Active)')
  })
})
