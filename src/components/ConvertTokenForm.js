import React, { Component } from 'react'
import { Button, Form, FormGroup, Label, Input } from 'reactstrap'
import { ROPSTEN_NETWORK_ID, KOVAN_NETWORK_ID } from './Constants.js';
import WrongNetworkModal from './WrongNetworkModal.js'
import {submitLockTx} from '../utils/lockBurn.js'

class ConvertTokenForm extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    const currNetwork = this.props.currNetwork;
    if (currNetwork == ROPSTEN_NETWORK_ID) {
      return (
      <LockTokenForm
      srcChain = 'ropsten'
      destChain = 'kovan'
      submitButtonText = 'Convert To Kovan'
      />
      );
    } else if (currNetwork == KOVAN_NETWORK_ID) {
      return (
      <LockTokenForm 
      srcChain = 'kovan'
      destChain = 'ropsten'
      submitButtonText = 'Convert To Ropsten'
      />
      );
    } else {
      return (
      <WrongNetworkModal />
      )
    }
  }
}

class LockTokenForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ethAmt: 0,
      recipient: '',
    }

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({[event.target.name]: event.target.value});
  }

  handleSubmit(event) {
    submitLockTx(this.state.recipient, this.state.ethAmt, this.props.srcChain, this.props.destChain)
    event.preventDefault();
  }

  render() {
    return (
      <div className="LockTokenForm">
        <Form onSubmit={this.handleSubmit}>
        
          <FormGroup>
            <label>ETH Amount</label>
            <Input type="number" name="ethAmt" value={this.state.ethAmt} onChange={this.handleChange} />
          </FormGroup>
  
          <FormGroup>
            <Label>Recipient address</Label>
            <Input type='text' name="recipient" value={this.state.recipient} onChange={this.handleChange}/>
          </FormGroup>
          
          <Button color="success" type="submit">{this.props.submitButtonText}</Button>
        </Form>
      </div>
    );
  }
}

export default ConvertTokenForm