import React, { Component } from 'react'
import { drizzleConnect } from 'drizzle-react'
import PropTypes from 'prop-types'

const contract = require('truffle-contract')
import CampaignContract from '../../build/contracts/Campaign.json'

let ethjsAbi = require('ethereumjs-abi') // for soliditySha3 algo


const APPROVAL_STATES = {
  0: 'Commit',
  1: 'Reveal',
  2: 'Approved',
  3: 'Rejected',
  4: 'Cancelled'
}

class Vote extends Component {
  constructor(props, context) {
    super(props)
    // TODO: Lift this state to the top and put in store (create reducer etc. and pass it in in mapStateToProps)
    this.dataKey = context.drizzle.contracts.EthFundMe.methods.isAdmin.cacheCall(props.account)

    this.state = {
      salt: 0
    }

    this.handleChange = this.handleChange.bind(this)
    this.handleApprove = this.handleApprove.bind(this)
    this.handleReject = this.handleReject.bind(this)
    this.loaded = false
  }

  handleChange(event) {
    this.setState({
      salt: event.target.value
    })
    event.preventDefault()
  }

  handleApprove(event) {
    console.log('approve')
    this.vote(true)
    event.preventDefault()
  }

  handleReject(event) {
    console.log('reject')
    this.vote(false)
    event.preventDefault()
  }

  vote(voteOption) {
    let voteSecret = '0x' + ethjsAbi.soliditySHA3(['bool', 'uint'], [voteOption, this.state.salt]).toString('hex')
    this.CampaignInstance.vote(voteSecret, { from: this.coinbase })
      .then((result) => {

      })
      .catch((err) => {

      })
  }

  componentDidMount() {
    // const web3Campaign = contract(CampaignContract)
    // web3Campaign.setProvider(web3.currentProvider)

    // web3.eth.getCoinbase((err, coinbase) => {
    //   if (err) {
    //     console.log(err)
    //   }
    //   this.coinbase = coinbase
    //   web3Campaign.at(this.props.address)
    //     .then((instance) => {
    //       this.CampaignInstance = instance
    //       return this.CampaignInstance.approvalState.call({ from: coinbase })
    //     })
    //     .then((approvalState) => {
    //       this.approvalState = Number(approvalState)
    //       return this.CampaignInstance.numVoteSecrets.call({ from: coinbase })
    //     })
    //     .then((numVoteSecrets) => {
    //       this.numVoteSecrets = Number(numVoteSecrets)
    //       return this.CampaignInstance.numVoteReveals.call({ from: coinbase })
    //     })
    //     .then((numVoteReveals) => {
    //       this.numVoteReveals = Number(numVoteReveals)
    //       return this.CampaignInstance.hasVoted.call(coinbase, { from: coinbase })
    //     })
    //     .then((hasVoted) => {
    //       console.log(`typeof hasVoted: ${typeof hasVoted}`)
    //       this.hasVoted = hasVoted
    //       return this.CampaignInstance.hasRevealed.call(coinbase, { from: coinbase })
    //     })
    //     .then((hasRevealed) => {
    //       this.hasRevealed = hasRevealed
    //       this.loaded = true
    //     })
    // })
  }

  render() {
    const EthFundMe = this.props.EthFundMe
    this.isAdmin = false

    if (this.dataKey in EthFundMe.isAdmin) {
      this.isAdmin = EthFundMe.isAdmin[this.dataKey].value
    }

    if (this.isAdmin) {
    // if (this.isAdmin && this.loaded) {
      return (
        <div className="Vote">
          <p>Approval Status: {APPROVAL_STATES[this.props.campaign.approvalState]}</p>

          {
            (this.props.campaign.approvalState === 0)
              ? <p> {this.props.campaign.numVoteSecrets} {(this.props.campaign.numVoteSecrets === 1) ? 'vote has' : 'votes have'} been placed </p> : null
          }

          {/* TODO: Hide the form once you submit it */}
          {/* TODO: Only show form if this admin has not voted */}

          <form>
            <div className="form-row">
              <div className="col-sm-3">
                {/* TODO: Generate random number for salt */}
                <input type="number" className="form-control" value={this.state.salt} onChange={this.handleChange}/>
              </div>
              {
                (this.props.campaign.approvalState === 0 && !this.props.campaign.hasVoted)
                  ? (
                  <div className="col-auto">
                    <button type="submit" className="btn btn-outline-success" onClick={this.handleApprove}>
                      Approve
                    </button>
                  </div>
                  ) : ''
              }
              {
                (this.props.campaign.approvalState === 0 && !this.props.campaign.hasVoted)
                  ? (
                  <div className="col-auto">
                    <button type="submit" className="btn btn-outline-danger" onClick={this.handleReject}>
                      Reject
                    </button>
                  </div>
                  ) : ''
              }
              {
                (this.props.campaign.approvalState === 1 && !this.props.campaign.hasRevealed)
                  ? (
                  <div className="col-auto">
                    <button type="submit" className="btn btn-outline-primary">
                      Reveal
                    </button>
                  </div>
                  ) : ''
              }
            </div>
          </form>
        </div>
      )
    }
    return null
  }
}

Vote.contextTypes = {
  drizzle: PropTypes.object
}

Vote.propTypes = {
  account: PropTypes.string.isRequired,
  campaign: PropTypes.object.isRequired
}

const mapStateToProps = (state, ownProps) => {
  return {
    EthFundMe: state.contracts.EthFundMe,
    account: state.accounts[0],
    campaign: state.campaigns[ownProps.i]
  }
}

export default drizzleConnect(Vote, mapStateToProps)
