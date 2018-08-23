import React, { Component } from 'react'
import { drizzleConnect } from 'drizzle-react'
import PropTypes from 'prop-types'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

class CreateCampaignButton extends Component {
  constructor(props, context) {
    super(props)
  }

  render() {
    if (!this.props.account.isAdmin) {
      return (
        <button
          type="button"
          className="btn btn-outline-success"
          data-toggle="modal"
          data-target="#createCampaignModal"
        >
          <FontAwesomeIcon className="button-icon" icon="plus" />
          Create Campaign
        </button>
      )
    }
    return null
  }
}

CreateCampaignButton.contextTypes = {
  drizzle: PropTypes.object
}

CreateCampaignButton.PropTypes = {
}

const mapStateToProps = (state, ownProps) => {
  return {
    account: state.account
  }
}

const mapDispatchToProps = (dispatch) => {
  return {}
}

export default drizzleConnect(CreateCampaignButton, mapStateToProps)
