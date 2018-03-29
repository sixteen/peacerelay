import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Button } from 'reactstrap'
import MDSpinner from 'react-md-spinner'
import { newTxStatus, updateTxStatus, removeTxStatus } from '../actions/txStatusActions'
import { MAX_ATTEMPTS, ROPSTEN_ETHERSCAN_LINK, InfuraRopsten, InfuraKovan, 
  EpRopsten, EpKovan, ETCToken, PeaceRelayRopsten, ETC_LOCKING_ADDRESS, PEACE_RELAY_ADDRESS_ROPSTEN } from './Constants.js'

var helper  = require('../../utils/helpers.js');
var BN = require('bn.js');
var signing = require('../utils/signing.js');
var EPs = {'kovan': EpKovan, 'ropsten': EpRopsten};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const mapStateToProps = (state) => ({
  web3: state.web3Status.web3,
  currAccount: state.web3Status.currAccount,
  ETCLocking: state.contracts.ETCLocking,
  PeaceRelayKovan: state.contracts.PeaceRelayKovan,
  })

class LockTxStatus extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ETCToken: ETCToken,
      relays: {'kovan': this.props.PeaceRelayKovan, 'ropsten': PeaceRelayRopsten}
    }

    this.createNewTxStatus = this.createNewTxStatus.bind(this)
    this.updateTxStatus = this.updateTxStatus.bind(this)
    this.removeTxStatus = this.removeTxStatus.bind(this)
    this.submitLockTx = this.submitLockTx.bind(this)
  }
  
  createNewTxStatus(id,msg) {
    this.props.dispatch(newTxStatus(id,msg))
  }

  updateTxStatus(id,msg) {
    this.props.dispatch(updateTxStatus(id,msg))
  }

  removeTxStatus(id) {
    this.props.dispatch(removeTxStatus(id))
  }

  submitLockTx() {
    let id = new Date().getTime()
    /*
    To use this code when Infura allows event listening
    ETCTokenMintEvent = this.state.ETCToken.Mint({to: this.props.recipient})
    ETCTokenMintEvent.watch(function(err,res){
      if(!err) {
        console.log(res)
        console.log("Tokens mined! =)")
      }
      else {
        console.log("Something went wrong!")
      }
    })
    */

    this.createNewTxStatus(id,"About to convert " + this.props.ethAmt + " ETH from " + this.props.srcChain + " to " + this.props.destChain)
    this.lock(id, async function(self,lockTxHash,id) {
      var attempts = 0;
      var receipt = self.getTransactionReceipt(attempts,lockTxHash);
      self.updateTxStatus(id,"Checking vaildity of transaction...")
      if(self.isValidReceipt(receipt.status)) {
        self.updateTxStatus(id, "Waiting for block to be relayed to Ropsten")
        let proof = await self.getProofFromTxHash(lockTxHash,self.props.srcChain);
        let blockHash = proof.blockHash;
        blockHash = self.convertBlockHashToBigNumFormat(blockHash);
        console.log("blockHash:" + blockHash)
        
        /*
        To use this code when Infura implements event listening
        //var RelayEvent = self.state.relays[self.props.destChain].SubmitBlock({blockHash: blockHash}) <-- To use when PeaceRelay indexes event argument
        let RelayEvent = self.state.relays[self.props.destChain].SubmitBlock()
        RelayEvent.watch(function(err, result) {
          if(!err) {
            console.log(result)
            if(result.args.blockHash == blockHash) {
              self.mint(self, proof, self.props.destChain)
            }
          } else {
            console.log(err)
          }
        })
        */
       attempts = 0;
       self.updateTxStatus(id,"Waiting for block from "+ self.props.srcChain + " to be relayed to " + self.props.destChain)
       if (await self.verifyRelayData(attempts,self.props.destChain,blockHash)) {
         await self.mint(id,proof,blockHash,self.props.destChain);
       } 
      } else {
        self.updateTxStatus(id,"Lock trx failed")
      }
    })
  }

  async lock(id, callback) {
    var txHash, data;
    let chain = this.props.srcChain,
    recipient = this.props.recipient,
    amount = this.props.ethAmt,
    self = this

    if(chain == 'kovan') {
      data = this.props.ETCLocking.lock.getData(recipient);
      await this.props.web3.eth.sendTransaction({
        data: data, 
        from: this.props.currAccount, 
        to: ETC_LOCKING_ADDRESS,
        value: this.props.web3.toWei(amount),
        gas: 100000}, 
        
        async function(err, res) {
          if(!err) {
            self.updateTxStatus(id,"Waiting for transaction to be mined....")
            //Need to add delay, otherwise status won't be updated
            await delay(100);
            callback(self,res,id)
          } else {
            self.removeTxStatus(id)
          }
        });

    } else {
      console.log("This function has not been implemented in the " + this.props.srcChain + "network yet. \
      Kindly use the " + this.props.destChain + "network.")
    }
  }

  getTransactionReceipt(attempts,lockTxHash) {
    if (attempts >= MAX_ATTEMPTS) {
      this.updateTxStatus('Unable to get Transaction Receipt!')
      return null
    }
  
    let receipt = InfuraKovan.eth.getTransactionReceipt(lockTxHash);
    if (!receipt) {
      //receipt is null, try again
      return this.getTransactionReceipt(attempts+1,lockTxHash);
    } else {
      console.log("blockNumber:" + receipt.blockNumber)
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
    return blockHash;
  }
  
  async mint(id, txProof, blockHash, destChain) {
    var data, res;
    if(destChain == 'ropsten') {
      console.log('Value:' + txProof.value)
      console.log('Blockhash:' + blockHash)
      console.log('Path:' + txProof.path)
      console.log('Nodes:' + txProof.parentNodes)
      
      data = this.state.ETCToken.mint.getData(txProof.value, blockHash, 
                                    txProof.path, txProof.parentNodes)
      var mintHash = await signing.mint(data)
      this.updateTxStatus(id,"Tokens have been minted and will be credited after <a href='" + ROPSTEN_ETHERSCAN_LINK + mintHash + "' target='_blank'>this transaction</a> has been mined.")
    } else {
      console.log("Wrong destination network.")
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
    var data = this.state.relays[destChain].blocks.getData(blockHash);
    var res = InfuraRopsten.eth.call({
      data: data, 
      from: this.props.currAccount, 
      to: PEACE_RELAY_ADDRESS_ROPSTEN
    });
    return (res > 0);
  }

  render() {
    return (
    <Button color="success" onClick={this.submitLockTx}>{this.props.submitButtonText}</Button>
    )
  }
}

export default connect(mapStateToProps)(LockTxStatus)