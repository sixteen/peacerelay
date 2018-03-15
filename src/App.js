import React, { Component } from 'react'
import NavigationBar from './components/NavigationBar'
import { Container, Row, Col } from 'reactstrap'
import ConversionForm from './components/ConversionForm'
import Balances from './components/Balances'
import { METAMASK_NOT_FOUND } from './components/Constants'

import './app.css'
import getWeb3 from './utils/getWeb3'

export default class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      web3: '',
      currNetwork: -1,
      currAccount: '',
      truncatedAccount: ''
    }
  }

  async componentDidMount() {
    setInterval(
      () => this.updateWeb3Status(), 1500
    )
  }

  async updateWeb3Status() {
    let results = await getWeb3;

    if (results.web3) {
      this.setState({ web3: results.web3 })
      
      if ((this.state.currNetwork !== results.web3.version.network) && results.web3.version.network) {
        this.setState({ currNetwork: results.web3.version.network })
      }

      if (results.web3.eth.accounts[0]) {
        let currAccount = results.web3.eth.accounts[0]
        let truncatedAccount = currAccount.slice(0,10)
        this.setState({ currAccount: currAccount, truncatedAccount: truncatedAccount })
      } else {
        this.setState({ currAccount: '', truncatedAccount: '' })
      } 
    } else {
      this.setState({ currNetwork: METAMASK_NOT_FOUND})
    }
  }

  render() {
    return (
    <div className="App">
      <NavigationBar network={this.state.currNetwork} truncatedAccount={this.state.truncatedAccount}/>
      <Container fluid={true} className="mainContainer">
        <Row>
        <Col xs="9">
        <ConversionForm web3={this.state.web3} network={this.state.currNetwork} account={this.state.currAccount} />
        </Col>
        <Col xs="3">
        <Balances web3={this.state.web3}/>
        </Col>
        </Row>
      </Container>
    </div>
    )
  } 
}
