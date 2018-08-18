let EthFundMe = artifacts.require('EthFundMe')
let Campaign = artifacts.require('Campaign')

let ethjsAbi = require('ethereumjs-abi') // for soliditySha3 algo

contract('Campaign Emergency Stop Contributions', (accounts) => {
  let EthFundMeInstance
  let CampaignInstance

  let salt = 123456789

  let voteOption0 = true
  let voteOption1 = true
  let voteOption2 = true

  let voteSecret0 = '0x' + ethjsAbi.soliditySHA3(['bool', 'uint'], [voteOption0, salt]).toString('hex')
  let voteSecret1 = '0x' + ethjsAbi.soliditySHA3(['bool', 'uint'], [voteOption1, salt]).toString('hex')
  let voteSecret2 = '0x' + ethjsAbi.soliditySHA3(['bool', 'uint'], [voteOption2, salt]).toString('hex')

  before('setup and reject campaign', (done) => {
    EthFundMe.deployed()
      .then((instance) => {
        EthFundMeInstance = instance
        return EthFundMeInstance.addAdminRole(accounts[1], { from: accounts[0] })
      })
      .then(() => {
        return EthFundMeInstance.addAdminRole(accounts[2], { from: accounts[1] })
      })
      .then(() => {
        return EthFundMeInstance.createCampaign(
          'test campaign',
          10,
          1,
          'test campaign description',
          'test image url',
          { from: accounts[3] }
        )
      })
      .then(() => {
        return EthFundMeInstance.campaigns.call(0)
      })
      .then((campaignAddress) => {
        CampaignInstance = Campaign.at(campaignAddress)
        return CampaignInstance.vote(voteSecret0, { from: accounts[0] })
      })
      .then(() => {
        return CampaignInstance.vote(voteSecret1, { from: accounts[1] })
      })
      .then(() => {
        return CampaignInstance.vote(voteSecret2, { from: accounts[2] })
      })
      .then(() => {
        return CampaignInstance.reveal(voteOption0, salt, { from: accounts[0] })
      })
      .then(() => {
        return CampaignInstance.reveal(voteOption0, salt, { from: accounts[1] })
      })
      .then(() => {
        return CampaignInstance.contribute({ from: accounts[4], value: 1 })
      })
      .then(() => {
        return CampaignInstance.contribute({ from: accounts[5], value: 1 })
      })
      .then(() => {
        return CampaignInstance.contribute({ from: accounts[5], value: 1 })
      })
      .then(() => {
        return CampaignInstance.contribute({ from: accounts[6], value: 1 })
      })
      .then(() => {
        done()
      })
  })

  it('should try to stop the contract from a non admin account and fail', (done) => {
    CampaignInstance.stopContract({ from: accounts[3] }).catch((e) => {
      CampaignInstance.isStopped.call().then((isStopped) => {
        assert.equal(isStopped, false, 'campaign should not be stopped')
        done()
      })
    })
  })

  it('should stop the campaign', (done) => {
    CampaignInstance.stopContract({ from: accounts[0] })
      .then(() => {
        return CampaignInstance.isStopped.call()
      })
      .then((isStopped) => {
        assert.equal(isStopped, true, 'campaign should be stopped')
        done()
      })
  })

  it('should attempt to make a contribution to stopped campaign and fail', (done) => {
    CampaignInstance.contribute({ from: accounts[7], value: 1 })
      .catch((e) => {
        return CampaignInstance.hasContributed.call(accounts[7])
      })
      .then((hasContributed) => {
        assert.equal(hasContributed, false, 'accounts[7] should not have contributed')
        done()
      })
  })

  it('should not allow the campaign manager to withdraw funds from stopped campaign', (done) => {
    CampaignInstance.withdraw({ fron: accounts[3] })
      .catch((e) => {
        return CampaignInstance.funds.call()
      })
      .then((funds) => {
        assert.equal(funds, 4, 'funds should be 4')
        done()
      })
  })

  it('should allow contributors to withdraw contributed funds from stopped campaign', (done) => {
    CampaignInstance.emergencyWithdraw({ from: accounts[4] })
      .then(() => {
        return CampaignInstance.funds.call()
      })
      .then((funds) => {
        assert.equal(funds, 3, 'funds should be 3')
        done()
      })
  })

  it('should try to resume the contract from a non admin account and fail', (done) => {
    CampaignInstance.resumeContract({ from: accounts[3] }).catch((e) => {
      CampaignInstance.isStopped.call().then((isStopped) => {
        assert.equal(isStopped, true, 'campaign should be stopped')
        done()
      })
    })
  })

  it('should resume the campaign', (done) => {
    CampaignInstance.resumeContract({ from: accounts[1] })
      .then(() => {
        return CampaignInstance.isStopped.call()
      })
      .then((isStopped) => {
        assert.equal(isStopped, false, 'campaign should be resumed')
        done()
      })
  })

  it('should accept new contributions once resumed', (done) => {
    CampaignInstance.contribute({ from: accounts[7], value: 1 }).then(() => {
      done()
    })
  })

  it('should have created a contribution', (done) => {
    CampaignInstance.hasContributed.call(accounts[7]).then((hasContributed) => {
      assert.equal(hasContributed, true, 'accounts[4] should have contributed')
      done()
    })
  })
})
