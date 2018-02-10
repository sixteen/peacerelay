import { verify } from 'secp256k1/lib/elliptic';

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

var MAX_ATTEMPTS = 100;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function submitLockTx(recipient, amount, srcChain, destChain) {
  console.log("About to Convert " + amount);
  lock(srcChain, amount, recipient, async function(lockTxHash) {
    console.log("LOCK TX: " + lockTxHash);
    var attempts = 0;
    var receipt = getTransactionReceipt(attempts,lockTxHash);
    
    console.log("Receipt Block Number:" + receipt.blockNumber);
    console.log("Receipt Status:" + receipt.status);

    if(IsValidReceipt(receipt.status)) {
      let proof = await getProofFromTxHash(lockTxHash,srcChain);
      let blockHash = proof.blockHash;
      console.log("Corresponding block hash " + blockHash);

      //Decide to not need to convert blockHash to BN format for now.
      //blockHash = convertBlockHashToBigNumFormat(blockHash);
      
      /* 
      SubmitBlock event has been disabled in Infura for now, so need to do long polling

      var relayEvent = relays[destChain].SubmitBlock({blockHash: blockHash});
      relayEvent.watch(function(err, result) {
        if(!err) {
          mint(proof, destChain);
        } else {
          console.log(err);
          //updateErrorUI(err);
        }
      });
      */
      attempts = 0;
      if (await verifyRelayData(attempts,destChain,blockHash)) {
        await mint(proof,destChain);
      } 
    } else {
      console.log("Lock trx failed")
      //updateErrorUI("The lock transaction has failed");
    }
  });
}

function lock(chain, amount, recipient, callback) {
  var txHash, data;

  console.log("lock " + chain + " " + recipient);
  if(chain == 'kovan') {
    data = ETCLocking.lock.getData(recipient);
    web3.eth.sendTransaction({
      data: data, 
      from: web3.eth.defaultAccount, 
      to: settings['kovan'].etcLockingAddress, 
      value: web3.toWei(amount),
      gas: 100000}, 
      
      function(err, res) {
        if(!err) {
          callback(res);
        } else {
          console.log(err)
          //updateErrorUI(err);
        }
      });

  } else {
    data = ETCToken.burn.getData(recipient);
    console.log(data)
    web3.eth.sendTransaction({
      data: data, 
      from: web3.eth.defaultAccount, 
      to: settings['ropsten'].etcTokenAddress, 
      value: web3.toWei(amount)}, 
      
      function(err, res) {
        if(!err) {
          txHash = res;
        } else {
          console.log(err)
          //updateErrorUI(err);
        }
      });
    }
}

function IsValidReceipt(status) {
  return (status == 1)
}

function getTransactionReceipt(attempts,lockTxHash) {
  if (attempts >= MAX_ATTEMPTS) {
    console.log('Unable to get Transaction Receipt!')
    return null
  } 

  let receipt = Kovan.eth.getTransactionReceipt(lockTxHash);
  if (!receipt) {
    //receipt is null, try again
    return getTransactionReceipt(attempts+1,lockTxHash);
  } else {
    return receipt;
  }
}

async function getProofFromTxHash(lockTxHash,srcChain) {
  let proof = await EPs[srcChain].getTransactionProof(lockTxHash);
  proof = helper.web3ify(proof);
  return proof;
}

function convertBlockHashToBigNumFormat(blockHash) {  
  blockHash = new BN(blockHash).toString();
  console.log("Block hash in Big Number:" + blockHash);
  return blockHash;
}

async function mint(proof, chain) {
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
    console.log('Minting....');
    var mintHash = await signing.mint(data);
    console.log("MINT HASH " + mintHash);
    // ETCToken.mint.sendTransaction(proof.value, proof.blockHash, 
    //                               proof.path, proof.parentNodes,
    //                               function(err, res) {
    //                                 if(err) {
    //                                   updateErrorUI(err);
    //                                 }
    //                               });
  }
}

async function verifyRelayData(attempts,destChain,blockHash) {
  if (attempts >= MAX_ATTEMPTS) {
    return false
  } else if (dataHasRelayed(destChain,blockHash)) {
    console.log("Relayed successful");
    return true
  } else {
    console.log('Attempt ' + attempts + ' has failed.');
    attempts += 1;
    await delay(15000);
    return verifyRelayData(attempts,destChain,blockHash);
  }
}

function dataHasRelayed(destChain, blockHash) {

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

export {submitLockTx}