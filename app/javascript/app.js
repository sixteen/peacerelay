var EP = require('eth-proof');
var Web3 = require('web3');
var helper  = require('../../utils/helpers.js');
var settings = require('../../cli/settings.json');
var signing = require('../../test/integration/signing.js');
const PeacerelayABI = require('../../build/contracts/PeaceRelay.json').abi;
const ETCTokenABI = require('../../build/contracts/ETCToken.json').abi;
const ETCLockingABI = require('../../build/contracts/ETCLocking.json').abi;

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

window.PeaceRelayRopsten = PeaceRelayRopsten;
window.PeaceRelayKovan = PeaceRelayKovan;
window.ETCToken = ETCToken;
window.ETCLocking = ETCLocking;

window.addEventListener('load', function() {

  $('#kovanButton').on('click', () => convertToRopsten());
  $('#ropstenButton').on('click', () => convertToKovan());

  $("#wait").hide();
  $("#success").hide();
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.log("ABC");
    // Use Mist/MetaMask's provider
    web3js = new Web3(web3.currentProvider);
  } else {
    console.log('No web3? You should consider trying MetaMask!')
    web3js = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }

  web3js.version.getNetwork((err, netId) => {
    switch (netId) {
      case "1":
        console.log('This is mainnet')
        break
      case "2":
        console.log('This is the deprecated Morden test network.')
        break
      case "3":
        console.log('This is the ropsten test network.')
        break
      case "4":
        console.log('This is the Rinkeby test network.')
        break
      case "42":
        console.log('This is the Kovan test network.')
        break
      default:
        console.log('This is an unknown network.')
    }

    web3js.eth.defaultAccount = web3js.eth.accounts[0];
    updateInterface(netId);
  });

});
    

function updateWaitingUI(message) {
  $("#wait").show();
  $("#message").innerHTML = message;
}

function updateSuccessUI() {
  $("#wait").hide();
  $("#success").show();
}

function updateErrorUI(err) {
  $("#wait").hide();
  $("#error").val(err);
}

function updateInterface(networkId) {
  console.log("about to update UI");
  console.log(networkId);
      
  if(networkId == 3) {
    $("#ropsten").show();
    $("#kovan").hide();
  } else {
    $("#ropsten").hide();
    $("#kovan").show();
  }

  $('#chainName').append(chainMapping[networkId.toString()]);
  console.log("ACCOUNT: " + web3js.eth.defaultAccount);
  $('#accountNum').append(web3js.eth.defaultAccount);
}
  
function lock(chain, amount, recipient, callback) {
  var txHash, data;

  console.log("lock " + chain + " recipient " + recipient);
  if(chain == 'kovan') {
    data = ETCLocking.lock.getData(recipient);
    web3js.eth.sendTransaction({data: data, from: web3js.eth.defaultAccount, to: settings['kovan'].etcLockingAddress, value: amount}, 
                                    function(err, res) {
                                      console.log(err);
                                      if(!err) {
                                        callback(res);
                                      } else {
                                        updateErrorUI(err);
                                      }
                                    });
  } else {
    data = ETCToken.burn.getData(recipient);
    web3js.eth.sendTransaction({data: data, from: web3js.eth.defaultAccount, to: settings['ropsten'].etcTokenAddress, value: amount}, 
                                  function(err, res) {
                                    if(!err) {
                                      txHash = res;
                                    } else {
                                      updateErrorUI(err);
                                    }
                                  });
  }

}

function mint(proof, chain) {
  var data, res;
  if(chain == 'kovan') {
    ETCLocking.unlock.sendTransaction(proof.value, proof.blockHash, 
                                      proof.path, proof.parentNodes,
                                      function(err, res) {
                                        if(err) {
                                          updateErrorUI(err);
                                        }
                                      });
  } else {
    data = ETCToken.mint.getData(proof.value, proof.blockHash, 
                                  proof.path, proof.parentNodes);

    signing.mint(data).then((res) => {
      // updateWaitingUI('Successfully converted');
      updateSuccessUI();
      console.log("MINT HASH " + res);
    });
    // ETCToken.mint.sendTransaction(proof.value, proof.blockHash, 
    //                               proof.path, proof.parentNodes,
    //                               function(err, res) {
    //                                 if(err) {
    //                                   updateErrorUI(err);
    //                                 }
    //                               });
  }
}


function convertToRopsten() {
  var recipient = $("#receiverRopsten").val();
  var amount = $("#amountKovan").val();
  convertToken(recipient, amount, 'kovan', 'ropsten');
}

function convertToKovan() {
  var recipient = $("#receiverKovan").val();
  var amount = $("#amountRopsten").val();
  convertToken(recipient, amount, 'ropsten', 'kovan');
}

function convertToken(recipient, amount, from, to) {
  console.log("About to Convert " + amount);
  lock(from, amount, recipient, function(lockTxHash) {

    console.log("LOCK TX: " + lockTxHash);
    updateWaitingUI("Waiting for the conversion");

    var receipt;
    while(true) {
      receipt = Kovan.eth.getTransactionReceipt(lockTxHash);
      if(receipt != null) {
        console.log("The lockTx has been mined into Kovan");
        updateWaitingUI('Lock Transaction is mined into Kovan');
        break;
      }
    }

    console.log("LockTx BlockNumber " + receipt.blockNumber);
    console.log("LockTx Status " + receipt.status);

    if(receipt.status == 1) {
      EPs[from].getTransactionProof(lockTxHash).then((proof) => { 
        proof = helper.web3ify(proof);
        var blockHash = proof.blockHash;

        window.a = relays[to];
        console.log(blockHash);
        // var BN = chains[to].utils.BN;
        // watch the relaying block event
        console.log("Corresponding block hash " + blockHash);
        // var relayEvent = relays[to].SubmitBlock({blockHash: blockHash});

        // relayEvent.watch(function(err, result) {
        //   if(!err) {
        //     console.log("Received the relayEvent, now going to mint");
        //     mint(proof, to);
        //   } else {
        //     updateErrorUI(err);
        //   }
        // });
        while(true) {
          var data = relays[to].blocks.getData(blockHash);
          console.log("data " + data);
          var res = Ropsten.eth.call({data: data, from: web3js.eth.defaultAccount, to: settings['ropsten'].peaceRelayAddress});
          console.log(res);
          if(res > 0) {
            console.log("Have relayed successfully");
            updateWaitingUI("The transaction is relayed successfully")
            mint(proof, to);
            break;
          } 

          // // console.log(res.body);
          // var res = signing.ethCall(data, to, settings[to].peaceRelayAddress);
          // console.log(res);
      }
    });

    } else {
      updateErrorUI("The lock transaction has failed");
    }

  });

}

