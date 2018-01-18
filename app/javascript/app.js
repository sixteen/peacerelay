var EP = require('eth-proof');
var Web3 = require('web3');
var settings = require('../../cli/settings.json');
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
var ETCLocking = ETCLocking.at(settings['kovan'].etcLockingAddress);

const EpRopsten = new EP(new Web3.providers.HttpProvider("https://ropsten.infura.io"));
const EpKovan = new EP(new Web3.providers.HttpProvider("https://kovan.infura.io"));

var EPs = {'kovan': EpKovan, 'ropsten': EpRopsten};
var chainMapping = {'1': 'mainnet', '3': 'ropsten', '42': 'kovan'};
var relays = {'kovan': PeaceRelayKovan, 'ropsten': PeaceRelayRopsten};
var helpers = {'kovan': ETCLocking, 'ropsten': ETCToken};
var chains = {'kovan': Kovan, 'ropsten': Ropsten};

window.addEventListener('load', function() {

  $("#wait").hide();
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

    updateInterface(netId);
  });

});
    

function updateWaitingUI() {
  $("#wait").show();
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
  console.log(web3js.eth.defaultAccount);
  $('#accountNum').append(web3js.eth.defaultAccount);
}
  
function lock(chain, amount, recipient) {
  var txHash;

  if(chain == 'kovan') {
    ETCLocking.lock.sendTransaction(recipient, {value: amount}, 
                                    function(err, res) {
                                      if(!err) {
                                        txHash = res;
                                      } else {
                                        updateErrorUI(err);
                                      }
                                    });
  } else {
    ETCToken.burn.sendTransaction(recipient, {value: amount}, 
                                  function(err, res) {
                                    if(!err) {
                                      txHash = res;
                                    } else {
                                      updateErrorUI(err);
                                    }
                                  });
  }

  // TODO: Fix this busy-waiting approach
  while(txHash == undefined);

  return txHash;
}

function mint(proof, chain) {
  if(chain == 'kovan') {
    ETCLocking.unlock.sendTransaction(proof.value.toString('hex'), proof.blockHash.toString('hex'), 
                                      proof.path.toString('hex'), proof.parentNodes.toString('hex'),
                                      function(err, res) {
                                        if(err) {
                                          updateErrorUI(err);
                                        }
                                      });
  } else {
    ETCToken.mint.sendTransaction(proof.value.toString('hex'), proof.blockHash.toString('hex'), 
                                  proof.path.toString('hex'), proof.parentNodes.toString('hex'),
                                  function(err, res) {
                                    if(err) {
                                      updateErrorUI(err);
                                    }
                                  });
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
  var lockTxHash = lock(from, amount, recipient);

  getEP(from).getTransactionProof(lockTxHash).then((proof) => { 
    var blockHash = proof.blockHash.toString('hex');

    updateWaitingUI();

    // watch the relaying block event
    var relayEvent = relays[to].SubmitBlock({blockHash: blockHash});

    relayEvent.watch(function(err, result) {
      if(!err) {
        mint(proof, to);
      } else {
        updateErrorUI(err);
      }
    });
  });
}

