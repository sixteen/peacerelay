import React, { Component } from 'react'
import { Button, Label, Input } from 'reactstrap'
import { KOVAN_NETWORK_ID, ETCLocking, ETCToken, ETC_LOCKING_ADDRESS, ETC_TOKEN_ADDRESS } from './Constants.js';

export default class Balances extends Component {
	constructor(props) {
		super(props);
		this.state = {
			kovanBalance: 0,
			rinkebyBalance: 0,
			kovanAddress: "",
			rinkebyAddress: ""
		}
		
		this.queryBalance = this.queryBalance.bind(this);
		this.handleChange = this.handleChange.bind(this);
	}

	queryBalance(queryNetwork) {
		if (!this.props.web3) {
			console.log('Web3 failed to pass down to component, or is not initialised.')
			return;
		}

		if (queryNetwork == 'kovan') {
			console.log('balanceOf() method has not been implemented in Smart Contract.')
			//ETCLocking has no method balanceOf. Consider storing balances to see how much ETH each person has locked up
			/*
			let data = ETCLocking.balanceOf.getData(this.state.kovanAddress);
			var balanceResult = InfuraKovan.eth.call({
				data: data,
				to: ETC_LOCKING_ADDRESS
			});
			this.setState({kovanBalance: InfuraKovan.fromWei(balanceResult, 'ether')});
			*/
		} else {
			let balance = ETCToken.balanceOf(this.state.rinkebyAddress)
			balance = this.props.web3.fromWei(balance, 'ether').toNumber()
			if (balance != this.state.rinkebyBalance) {
				this.setState({rinkebyBalance: balance})
			}
		}
	}

	handleChange(event) {
		this.setState({[event.target.name]: event.target.value});
	}

	render() {
		return (
			<div className="tokenBalance">
				<h4 className="tokenBalanceTitle">Locked ETH in Kovan</h4>
				<h6>balanceOf() not implemented in ETCLocking yet</h6>
				<hr className="divider"/>
				<p>{this.state.kovanBalance} ETH</p>
	            <Input type='text' name="kovanAddress" placeholder="Wallet Address" value={this.state.kovanAddress} onChange={this.handleChange}/>
	          	<Button color="info" onClick={() => this.queryBalance('kovan')} block>Query</Button>
				<br />
				<h4 className="tokenBalanceTitle">ETC Tokens in Rinkeby</h4>
				<hr className="divider"/>
				<p>{this.state.rinkebyBalance} ETC</p>
	            <Input type='text' name="rinkebyAddress" placeholder="Wallet Address" value={this.state.rinkebyAddress} onChange={this.handleChange}/>
	          	<Button color="info" onClick={() => this.queryBalance('rinkeby')} block>Query</Button>
			</div>
		);
	}
}