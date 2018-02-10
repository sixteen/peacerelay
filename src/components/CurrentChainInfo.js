import React, { Component } from 'react'
import { FormGroup, Label, Input } from 'reactstrap'
import { MAIN_NETWORK_ID, MORDEN_NETWORK_ID, ROPSTEN_NETWORK_ID, RINKEBY_NETWORK_ID, KOVAN_NETWORK_ID } from './Constants.js';

class CurrentChainInfo extends Component {
  constructor(props) {
    super(props)
  }
  
  getCurrentNetwork() {
    switch(this.props.currNetwork) {
      case MAIN_NETWORK_ID:
        return "Main Network"
      
        case MORDEN_NETWORK_ID:
        return "Morden Testnet (Depreciated)"
      
        case ROPSTEN_NETWORK_ID:
        return "Ropsten Testnet"
      
        case RINKEBY_NETWORK_ID:
        return "Rinkeby Testnet"
      
        case KOVAN_NETWORK_ID:
        return "Kovan Testnet"

        default:
        return "Unknown network"
    }
  }
  
  render() {
    return (
      <div className="CurrentChainInfo">
        <FormGroup>
          <Label>Current Chain</Label>
          <Input type='text' disabled value={this.getCurrentNetwork()}/>
        </FormGroup>
      </div>
    );
  }
}
  
  export default CurrentChainInfo