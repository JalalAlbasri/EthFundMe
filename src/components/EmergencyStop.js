import React, { Component } from 'react'
import { drizzleConnect } from 'drizzle-react'
import PropTypes from 'prop-types'

import { emergencyStop } from '../actions/CampaignActions'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

class EmergencyStop extends Component {
  constructor(props, context) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }

  handleClick(event) {
    this.props.dispatchEmergencyStop(this.props.campaign)
    event.preventDefault()
  }

  render() {
    if (this.props.account.isAdmin) {
      return (
        <button
          type="button"
          className={'EmergencyStop ml-2 btn btn-outline-' + (this.props.campaign.isStopped ? 'primary' : 'danger')}
          onClick={this.handleClick}
        >
          <FontAwesomeIcon className="button-icon" icon={this.props.campaign.isStopped ? 'play-circle' : 'stop-circle'} />
          {this.props.campaign.isStopped ? 'Resume Contract' : 'Emergency Stop Contract'}
        </button>
      )
    }

    return null
  }
}

EmergencyStop.contextTypes = {
  drizzle: PropTypes.object
}

EmergencyStop.propTypes = {
  account: PropTypes.object.isRequired,
  campaign: PropTypes.object.isRequired
}

const mapStateToProps = (state, ownProps) => {
  return {
    account: state.account
  }
}

const mapDispathToProps = (dispatch) => {
  return {
    dispatchEmergencyStop: (campaign) => {
      dispatch(emergencyStop(campaign))
    }
  }
}

export default drizzleConnect(EmergencyStop, mapStateToProps, mapDispathToProps)
