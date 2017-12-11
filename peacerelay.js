const Web3 = require('web3')
const request = require('superagent')
const rlp = require('rlp')
const EthereumBlock = require('ethereumjs-block/from-rpc')
const commandLineArgs = require('command-line-args')
const peacerelayABI = require('./peacerelay.json')
const submitBlock = require('./signing');
const settings = require("./settings.json");
const secrets = require("./secrets.json");


// const optionDefinitions = [
//   { name: 'from', alias: 'f', type: String },
//   { name: 'to', alias: 't', type: String },
//   { name: 'start', alias: 's', type: Number },
//   { name: 'privateKey', alias: 'p', type: String }
// ]

var options = {};

var from, to, startingBlockNumber, From, To;

Pr = function(from, to, start) {
	options.from = from;
	options.to = to;
	options.start = start;
	from = settings[options.from].url;

	to = settings[options.to];
	to.privateKey = secrets[options.to].privateKey;

	startingBlockNumber = options.start;

	From = new Web3(new Web3.providers.HttpProvider(from));
	To = new Web3(new Web3.providers.HttpProvider(to.url));

	var PeaceRelayTo = new To.eth.contract(peacerelayABI);
	PeaceRelayTo = PeaceRelayTo.at(to.peaceRelayAddress);
	Pr.PeaceRelayTo = PeaceRelayTo;
	return Pr;
}

module.exports = Pr;


// run();
// function run() {
//   postFrom().then((result) => {
//     run();
//   }).catch((err) => {
//     console.error(err);
//   });
// }

/**
 * @name postForm
 * @description <what-does-it-do?>
 * @param x Does something cool
 * @returns Something even cooler
 */
Pr.postFrom = async function(){
  try {
    result = await request
      .post(from)
      .send({ "jsonrpc": "2.0", "method": "eth_blockNumber", "params": [], "id": 83 })
      .set('Accept', 'application/json')
    console.log("HEE");
    console.log(parseInt(result.body.result, 16));
    await catchUp(startingBlockNumber, parseInt(result.body.result, 16));
  } catch (e) {
    console.error(e);
  }
}

/**
 * @name catchUp
 * @param i 
 * @param num
 * @returns  
 */
Pr.catchUp = async function(i, num) {
  if (i < num - 3) {
    const result = await relay(i);
    if (result && result.body && result.body.error) {
      return await catchUp(i, num)
    }
    startingBlockNumber += 1;
    await catchUp(i + 1, num)
  }
}


Pr.relay = async function(num) {
  try {
    block = await From.eth.getBlock(num);
    if (block === null) {
      return await relay(num);
    }
    data = await PeaceRelayTo.methods.submitBlock(block.hash, '0x' + rlp.encode(getRawHeader(block)).toString('hex')).encodeABI();
    hash = await submitBlock(data, to);
    return result;
  } catch (e) {
    console.error(e);
  }

  function getRawHeader(_block) {
    if (typeof _block.difficulty != 'string') {
      _block.difficulty = '0x' + _block.difficulty.toString(16)
    }
    var block = new EthereumBlock(_block)
    return block.header.raw
  }
}
