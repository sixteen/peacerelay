import React, { Component } from 'react'
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'
import MDSpinner from 'react-md-spinner'
import { MAX_ATTEMPTS, KOVAN_ETHERSCAN_LINK, InfuraKovan, InfuraRopsten, 
  ETCToken, ETCLocking, ETC_TOKEN_ADDRESS, EPs, RELAYS, PEACE_RELAY_ADDRESS_KOVAN} from './Constants.js'
import { verify } from 'secp256k1/lib/elliptic'
import Parser from 'html-react-parser'

var helper  = require('../../utils/helpers.js');
var BN = require('bn.js');

var signing = require('../utils/signing.js');
var web3 = window.web3
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

class BurnTxStatus extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      txStatus: '',
      modal: true,
    }

    this.toggle = this.toggle.bind(this);
    this.updateTxStatus = this.updateTxStatus.bind(this);
  }

  toggle() {
    this.setState({
      modal: !this.state.modal
    })
  }

  updateTxStatus(_message) {
    this.setState({txStatus: _message})
  }

  submitBurnTx() {

    this.updateTxStatus("About to burn " + this.props.ethAmt + " ETH from " + this.props.srcChain + " to " + this.props.destChain)
    this.burn(async function(self,burnTxHash) {
      var attempts = 0;
      var receipt = self.getTransactionReceipt(attempts,burnTxHash);

      self.updateTxStatus("Checking vaildity of transaction...")
      if(self.isValidReceipt(receipt.status)) {
        let [txProof,receiptProof] = await self.getProofsFromTxHash(burnTxHash,self.props.srcChain);
        console.log('TxValue:' + txProof.value)
        console.log('Blockhash:' + txProof.blockHash)
        console.log('TxPath:' + txProof.path)
        console.log('TxNodes:' + txProof.parentNodes)
        console.log('RecValue:' + receiptProof.value)
        console.log('RecPath:' + receiptProof.path)
        console.log('RecNodes:' + receiptProof.parentNodes)
        let blockHash = txProof.blockHash;
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
          await self.unlock(txProof,receiptProof,blockHash,self.props.destChain);
        } 
      } else {
        self.updateTxStatus("Burn trx failed")
      }
    });
  }

  async burn(callback) {
    var txHash, data;
    let chain = this.props.srcChain,
    recipient = this.props.recipient,
    amount = this.props.ethAmt,
    self = this

    if(chain == 'ropsten') {
      data = ETCToken.burn.getData(web3.toWei(amount),recipient);
      await web3.eth.sendTransaction({
        data: data, 
        from: web3.eth.defaultAccount, 
        to: ETC_TOKEN_ADDRESS, 
        gas: 100000}, 
        
        async function(err, res) {
          if(!err) {
            self.updateTxStatus("Waiting for transaction to be mined....")
            //Need to add delay, otherwise status won't be updated
            await delay(1000);
            callback(self,res);
          } else {
            self.updateTxStatus("Transaction was rejected.")
            await delay(1000);
            self.updateTxStatus("");
          }
        });

    } else {
        self.updateTxStatus("This function has not been implemented in the " + this.props.srcChain + "network yet. \
        Kindly use the " + this.props.destChain + "network.")
    }
  }

  getTransactionReceipt(attempts,lockTxHash) {
    if (attempts >= MAX_ATTEMPTS) {
      this.updateTxStatus('Unable to get Transaction Receipt!')
      return null
    }
  
    let receipt = InfuraRopsten.eth.getTransactionReceipt(lockTxHash);
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

  async getProofsFromTxHash(lockTxHash,srcChain) {
    let txProof = await EPs[srcChain].getTransactionProof(lockTxHash);
    txProof = helper.web3ify(txProof);
    let receiptProof = await EPs[srcChain].getReceiptProof(lockTxHash);
    receiptProof = helper.web3ify(receiptProof);
    return [txProof,receiptProof];
  }
  
  convertBlockHashToBigNumFormat(blockHash) {  
    blockHash = new BN(blockHash).toString();
    console.log("Block hash in Big Number:" + blockHash);
    return blockHash;
  }
  
  async unlock(txProof, receiptProof, blockHash, destChain) {
    var data, res;
    if(destChain == 'kovan') {
      data = ETCLocking.unlock.getData(txProof.value, blockHash, txProof.path, txProof.parentNodes,
      receiptProof.value, receiptProof.path, receiptProof.parentNodes)

      let unlockHash = await signing.unlock(data);
      this.updateTxStatus("Waiting for <a href='" + KOVAN_ETHERSCAN_LINK + unlockHash + "' target='_blank'>this transaction</a> to be mined."); 
      
    } else {
        this.updateTxStatus("Wrong destination network.")
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
  
    var data = RELAYS[destChain].blocks.getData(blockHash);
    var res = InfuraKovan.eth.call({
      data: data, 
      from: web3.eth.defaultAccount, 
      to: PEACE_RELAY_ADDRESS_KOVAN
    });
    return (res > 0);
  }

  render() {
    if (!this.state.txStatus) {
      return null
    } else {
      return (
        <div>
          <Button outline color="warning" onClick={this.toggle} className="pendingTxButton">View Pending Transaction</Button>
            <Modal isOpen={this.state.modal} toggle={this.toggle}>
              <ModalHeader toggle={this.toggle}>Transaction</ModalHeader>
              
              <ModalBody className="txStatusModalCenter">
                {Parser(this.state.txStatus)}
                <div>
                  <MDSpinner size={50} />
                </div>
              </ModalBody>
              
              <ModalFooter>
                <Button outline color="danger" onClick={this.toggle}>Close</Button>
              </ModalFooter>
            </Modal>
        </div>
      )
    }
  }
}

export default BurnTxStatus