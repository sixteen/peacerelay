import React, { Component } from 'react'
import { Jumbotron, Button, Form, FormGroup, Label, Input } from 'reactstrap'
import { ROPSTEN_NETWORK_ID, KOVAN_NETWORK_ID } from './Constants.js';
import WrongNetworkModal from './WrongNetworkModal.js'
import LockTxStatus from './LockTxStatus.js'
import BurnTxStatus from './BurnTxStatus.js'

export default class ConversionForm extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    const currNetwork = this.props.network;
    if (currNetwork == ROPSTEN_NETWORK_ID) {
      return (
      <div>
        <h1 className="conversionFormTitle">Ropsten to Kovan</h1>
        <hr />
        <TokenForm
        web3={this.props.web3}
        srcChain='ropsten'
        destChain='kovan'
        submitButtonText='Convert Back To Kovan'
        isLock  = {false}
        />
      </div>
      );
    } else if (currNetwork == KOVAN_NETWORK_ID) {
      return (
      <div>
        <h1 className="conversionFormTitle">Kovan to Ropsten</h1>
        <hr className="divider"/>
        <TokenForm 
        web3={this.props.web3}
        srcChain='kovan'
        destChain='ropsten'
        submitButtonText='Convert To Ropsten'
        isLock={true}
        />
      </div>
      );
    } else {
      return (
      <Jumbotron>
        <h1>Wrong network</h1>
      </Jumbotron>
      )
    }
  }
}

class TokenForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      web3: this.props.web3,
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
    //submitLockTx(this.state.recipient, this.state.ethAmt, this.props.srcChain, this.props.destChain)
    event.preventDefault();
  }

  render() {
    return (
      <div className="tokenForm">
        <Form onSubmit={this.handleSubmit}>
        
          <FormGroup>
            <label>ETH Amount</label>
            <Input type="number" name="ethAmt" value={this.state.ethAmt} onChange={this.handleChange} />
          </FormGroup>
  
          <FormGroup>
            <Label>Recipient address</Label>
            <Input type='text' name="recipient" value={this.state.recipient} onChange={this.handleChange}/>
          </FormGroup>
          
          <LockOrBurn 
          isLock={this.props.isLock}
          recipient={this.state.recipient} 
          ethAmt={this.state.ethAmt}
          srcChain={this.props.srcChain}
          destChain={this.props.destChain}
          submitButtonText={this.props.submitButtonText}
          parent={this}
          />

          {/*}
          <LockTxStatus
          ref={instance => {this.child = instance; }} 
          recipient = {this.state.recipient}
          ethAmt = {this.state.ethAmt}
          srcChain = {this.props.srcChain}
          destChain = {this.props.destChain}
          />
          <Button color='success' onClick={() => this.child.submitLockTx()}>{this.props.submitButtonText}</Button>
          */}

        </Form>
      </div>
    );
  }
}

function LockOrBurn(props) {
  const isLock = props.isLock
  if (isLock) {
    return (
    <div>
    <LockTxStatus
    ref={instance => {props.parent.child = instance; }} 
    recipient = {props.recipient}
    ethAmt = {props.ethAmt}
    srcChain = {props.srcChain}
    destChain = {props.destChain}
    />
    <Button color='success' onClick={() => props.parent.child.submitLockTx() }>{props.submitButtonText}</Button>
    </div>
    )
  } else {
    return (
    <div>
    <BurnTxStatus
    ref={instance => {props.parent.child = instance; }} 
    recipient = {props.recipient}
    ethAmt = {props.ethAmt}
    srcChain = {props.srcChain}
    destChain = {props.destChain}
    />
    <Button color='danger' onClick={() => props.parent.child.submitBurnTx() }>{props.submitButtonText}</Button> 
    </div>
    )
  }
}