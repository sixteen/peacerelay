const Web3 = require('web3')
const request = require('superagent')
const rlp = require('rlp')
const EthereumBlock = require('ethereumjs-block/from-rpc')
const commandLineArgs = require('command-line-args')

const peacerelayABI = require('./peacerelay.json')
const submitBlock = require('./signing');
const settings = require("./settings.json");
const secrets = require("./secrets.json");


const optionDefinitions = [
  { name: 'from', alias: 'f', type: String },
  { name: 'to', alias: 't', type: String },
  { name: 'start', alias: 's', type: Number },
  { name: 'privateKey', alias: 'p', type: String }
]

const options = commandLineArgs(optionDefinitions)

const from = settings[options.from].url;

const to = settings[options.to];
to.privateKey = secrets[options.to].privateKey;

const startingBlockNumber = options.start;

const From = new Web3(new Web3.providers.HttpProvider(from));
const To = new Web3(new Web3.providers.HttpProvider(to.url));

const PeaceRelayTo = new To.eth.Contract(peacerelayABI);
PeaceRelayTo.options.address = to.peaceRelayAddress;


run();
function run() {
  postFrom().then((result) => {
    run();
  }).catch((err) => {
    console.error(err);
  });
}

/**
 * @name postForm
 * @description <what-does-it-do?>
 * @param x Does something cool
 * @returns Something even cooler
 */
async function postFrom() {
  try {
    result = await request
      .post(from)
      .send({ "jsonrpc": "2.0", "method": "eth_blockNumber", "params": [], "id": 83 })
      .set('Accept', 'application/json')
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
async function catchUp(i, num) {
  if (i < num - 3) {
    const result = await relay(i);
    if (result && result.body && result.body.error) {
      return await catchUp(i, num)
    }
    startingBlockNumber += 1;
    await catchUp(i + 1, num)
  }
}


async function relay(num) {
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
