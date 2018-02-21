import React, { Component } from 'react'
import { Button, Form, FormGroup, Label, Input } from 'reactstrap'
import { KOVAN_NETWORK_ID } from './Constants.js';
var BigNumber = require('bignumber.js');

var Web3 = require('web3');
const Ropsten = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io"));
const Kovan = new Web3(new Web3.providers.HttpProvider("https://kovan.infura.io"));
var settings = require('../../cli/settings.json');
const ETCTokenABI = require('../../build/contracts/ETCToken.json').abi;
const ETCLockingABI = require('../../build/contracts/ETCLocking.json').abi;
var ETCTokenContract = Ropsten.eth.contract(ETCTokenABI);
var ETCLockingContract = Kovan.eth.contract(ETCLockingABI);
var ETCToken = ETCTokenContract.at(settings['ropsten'].etcTokenAddress);
var ETCLocking = ETCLockingContract.at(settings['kovan'].etcLockingAddress);

const networks = {'kovan': Kovan, 'ropsten': Ropsten};
const contracts = {'kovan': ETCLocking, 'ropsten': ETCToken};


class TokenBalance extends Component {
	constructor(props) {
		super(props);
		this.state = {
			balance: 0,
			address: "0x",
			queryNetwork: ''
		}

		if(this.props.currNetwork == KOVAN_NETWORK_ID) {
			this.state.queryNetwork = 'ropsten';
		} else {
			this.state.queryNetwork = 'kovan';
		}
		this.queryBalance = this.queryBalance.bind(this);
		this.handleChange = this.handleChange.bind(this);
	}

	queryBalance(event) {
		event.preventDefault();
		var data = contracts[this.state.queryNetwork].balanceOf.getData(this.state.address);
		var balanceResult = networks[this.state.queryNetwork].eth.call({
			data: data,
			to: settings['ropsten'].etcTokenAddress
		});
		this.setState({balance: Ropsten.fromWei(new BigNumber(balanceResult).toString(10), 'ether')});
	}

	handleChange(event) {
		this.setState({[event.target.name]: event.target.value});
	}

	render() {
		return (
			<div className="tokenBalance">
				<Form onSubmit={this.queryBalance}>
					<FormGroup>
	            		<Label>Recipient address in {this.state.queryNetwork}</Label>
	            		<Input type='text' name="address" value={this.state.address} onChange={this.handleChange}/>
	          		</FormGroup>
	          
	          		<Button color="info" type="submit">Query</Button>

	          		<FormGroup>
	            		<Label>Recipient Balance</Label>
	            		<Input type='text' disabled name="recipient" value={this.state.balance} onChange={this.handleChange}/>
	          		</FormGroup>
	          	</Form>
			</div>

		);
	}
}

export default TokenBalance;