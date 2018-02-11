import React, { Component } from 'react'
import CurrentChainInfo from './components/CurrentChainInfo.js';
import AccountInfo from './components/AccountInfo.js';
import ConvertTokenForm from './components/ConvertTokenForm.js';
import TokenBalance from './components/TokenBalance.js';

import './app.css'
import getWeb3 from './utils/getWeb3'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      currNetwork: '',
      currAccount: ''
    }
  }

  async componentDidMount() {
    setInterval(
      () => this.updateWeb3Status(), 1500
    )
  }

  async updateWeb3Status() {
    let results = await getWeb3;
    this.setState({ 
      web3: results.web3,
      currNetwork: await results.web3.version.network,
      currAccount: await results.web3.eth.accounts[0]
    })
  }

  render() {
    if (!this.state.currNetwork) {
      return (
        <div>
          <div>
            <h1>Metamask Not Installed</h1>
          </div>
        </div>
      )
    } else if (!this.state.currAccount) {
      return (
        <div>
          <div>
            <h1>Metamask Locked</h1>
          </div>
        </div>
      )
    } else {
      return (
        <div>
          <div>
            <h1>Peace Relay</h1>
          </div>
        <AccountInfo 
        currAccount = {this.state.currAccount}
        />
        <CurrentChainInfo 
        currNetwork = {this.state.currNetwork}
        />
        <ConvertTokenForm 
        currNetwork = {this.state.currNetwork}
        />
        <TokenBalance
        currNetwork = {this.state.currNetwork}
        />
        </div>
      )
    }
  }
}

export default App;
