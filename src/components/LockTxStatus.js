import React, { Component } from 'react'
import MDSpinner from 'react-md-spinner'
import { MAX_ATTEMPTS } from './Constants.js';
import { verify } from 'secp256k1/lib/elliptic'

var EP = require('eth-proof');
var Web3 = require('web3');
var helper  = require('../../utils/helpers.js');
var BN = require('bn.js');
var settings = require('../../cli/settings.json');
var signing = require('../utils/signing.js');
const PeacerelayABI = require('../../build/contracts/PeaceRelay.json').abi;
const ETCTokenABI = require('../../build/contracts/ETCToken.json').abi;
const ETCLockingABI = require('../../build/contracts/ETCLocking.json').abi;

var web3 = window.web3
const Ropsten = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io"));
const Kovan = new Web3(new Web3.providers.HttpProvider("https://kovan.infura.io"));

var PeaceRelayRopstenContract = Ropsten.eth.contract(PeacerelayABI);
var PeaceRelayKovanContract = Kovan.eth.contract(PeacerelayABI);
var ETCTokenContract = Ropsten.eth.contract(ETCTokenABI);
var ETCLockingContract = Kovan.eth.contract(ETCLockingABI);
 
var PeaceRelayRopsten = PeaceRelayRopstenContract.at(settings['ropsten'].peaceRelayAddress);
var PeaceRelayKovan = PeaceRelayKovanContract.at(settings['kovan'].peaceRelayAddress);
var ETCToken = ETCTokenContract.at(settings['ropsten'].etcTokenAddress);
var ETCLocking = ETCLockingContract.at(settings['kovan'].etcLockingAddress);

const EpRopsten = new EP(new Web3.providers.HttpProvider("https://ropsten.infura.io"));
const EpKovan = new EP(new Web3.providers.HttpProvider("https://kovan.infura.io"));

var EPs = {'kovan': EpKovan, 'ropsten': EpRopsten};
var chainMapping = {'1': 'mainnet', '3': 'ropsten', '42': 'kovan'};
var relays = {'kovan': PeaceRelayKovan, 'ropsten': PeaceRelayRopsten};
var helpers = {'kovan': ETCLocking, 'ropsten': ETCToken};
var chains = {'kovan': Kovan, 'ropsten': Ropsten};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

class LockTxStatus extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      txStatus: '',
    }

    this.updateTxStatus = this.updateTxStatus.bind(this);
  }

  updateTxStatus(_message) {
    this.setState({txStatus: _message})
  }

  submitLockTx() {
    this.updateTxStatus("About to convert " + this.props.ethAmt + " ETH from " + this.props.srcChain + " to " + this.props.destChain)
    this.lock(async function(self,lockTxHash) {
      var attempts = 0;
      var receipt = self.getTransactionReceipt(attempts,lockTxHash);
      
      self.updateTxStatus("Checking vaildity of transaction...")
      if(self.isValidReceipt(receipt.status)) {
        let proof = await self.getProofFromTxHash(lockTxHash,self.props.srcChain);
        let blockHash = proof.blockHash;
        blockHash = self.convertBlockHashToBigNumFormat(blockHash);
        
        /* 
        SubmitBlock event has been disabled in Infura for now, so need to do long polling
  
        var relayEvent = relays[destChain].SubmitBlock({blockHash: blockHash});
        relayEvent.watch(function(err, result) {
          if(!err) {
            mint(proof, destChain);
          } else {
            console.log(err);
          }
        });
        */
        attempts = 0;
        self.updateTxStatus("Waiting for block from "+ self.props.srcChain + " to be relayed to " + self.props.destChain)
        if (await self.verifyRelayData(attempts,self.props.destChain,blockHash)) {
          await self.mint(proof,self.props.destChain);
        } 
      } else {
        self.updateTxStatus("Lock trx failed")
      }
    });
  }

  async lock(callback) {
    var txHash, data;
    let chain = this.props.srcChain,
    recipient = this.props.recipient,
    amount = this.props.ethAmt,
    self = this

    if(chain == 'kovan') {
      data = ETCLocking.lock.getData(recipient);
      await web3.eth.sendTransaction({
        data: data, 
        from: web3.eth.defaultAccount, 
        to: settings['kovan'].etcLockingAddress, 
        value: web3.toWei(amount),
        gas: 100000}, 
        
        function(err, res) {
          if(!err) {
            callback(self,res);
          } else {
            self.updateTxStatus("Transaction didn't go through.")
          }
        });
      /* TO-DO: Find a way to detect pending transactions
      let options = {
        fromBlock: "pending",
        toBlock: "latest",
        address: web3.eth.defaultAccount
      }
      var filter = web3.eth.filter(options)
      filter.watch(function(err,res) {
        if (!err)
        console.log(res);
      })
      */
    } else {
      data = ETCToken.burn.getData(recipient);
      console.log(data)
      await web3.eth.sendTransaction({
        data: data, 
        from: web3.eth.defaultAccount, 
        to: settings['ropsten'].etcTokenAddress, 
        value: web3.toWei(amount)}, 
        
        function(err, res) {
          if(!err) {
            txHash = res;
          } else {
            console.log(err)
          }
        });
      }
  }

  getTransactionReceipt(attempts,lockTxHash) {
    if (attempts >= MAX_ATTEMPTS) {
      this.updateTxStatus('Unable to get Transaction Receipt!')
      return null
    }
  
    let receipt = Kovan.eth.getTransactionReceipt(lockTxHash);
    if (!receipt) {
      //receipt is null, try again
      return this.getTransactionReceipt(attempts+1,lockTxHash);
    } else {
      return receipt;
    }
  }

  isValidReceipt(status) {
    return (status == 1)
  }

  async getProofFromTxHash(lockTxHash,srcChain) {
    let proof = await EPs[srcChain].getTransactionProof(lockTxHash);
    proof = helper.web3ify(proof);
    return proof;
  }
  
  convertBlockHashToBigNumFormat(blockHash) {  
    blockHash = new BN(blockHash).toString();
    console.log("Block hash in Big Number:" + blockHash);
    return blockHash;
  }
  
  async mint(proof, chain) {
    var data, res;
    if(chain == 'kovan') {
      ETCLocking.unlock.sendTransaction(proof.value, proof.blockHash, 
                                        proof.path, proof.parentNodes,
                                        function(err, res) {
                                          if(err) {
                                            console.log(err);
                                          }
                                        });
    } else {
      data = ETCToken.mint.getData(proof.value, proof.blockHash, 
                                    proof.path, proof.parentNodes);
      this.updateTxStatus('Minting....');
      var mintHash = await signing.mint(data);
      this.updateTxStatus("Tokens have been mined! Check this transaction in " + this.props.destChain + "!{'\n'} Transaction hash:" + mintHash);
      // ETCToken.mint.sendTransaction(proof.value, proof.blockHash, 
      //                               proof.path, proof.parentNodes,
      //                               function(err, res) {
      //                                 if(err) {
      //                                   updateErrorUI(err);
      //                                 }
      //                               });
    }
  }
  
  async verifyRelayData(attempts,destChain,blockHash) {
    if (attempts >= MAX_ATTEMPTS) {
      return false
    } else if (this.dataHasRelayed(destChain,blockHash)) {
      console.log("Relay successful");
      return true
    } else {
      console.log('Attempt ' + attempts + ' has failed.');
      attempts += 1;
      await delay(15000);
      return this.verifyRelayData(attempts,destChain,blockHash);
    }
  }
  
  dataHasRelayed(destChain, blockHash) {
  
    var data = relays[destChain].blocks.getData(blockHash);
    console.log("Data:" + data);
    var res = Ropsten.eth.call({
      data: data, 
      from: web3.eth.defaultAccount, 
      to: settings['ropsten'].peaceRelayAddress
    });
    console.log('Result:' + res);
    return (res > 0);
  }

  render() {
    if (!this.state.txStatus) {
      return null
    } else {
      return (
        <div>
        <p>{this.state.txStatus}</p>
        <MDSpinner size={100} />
        </div>
      )
    }
  }
}

export default LockTxStatus