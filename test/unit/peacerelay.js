const rlp = require('rlp');
const EthereumBlock = require('ethereumjs-block/from-rpc')

const PeaceRelay = artifacts.require("./Peacerelay.sol");

contract('Peacerelay', (accounts) => {
  var block;
  

  it("Submitting a block", async () => {
    
    const relay = await PeaceRelay.deployed();
    const highestBlock = await relay.highestBlock();
    const newBlockNumber = highestBlock.toNumber() + 1;
    block = await web3.eth.getBlock(newBlockNumber)

    await relay.submitBlock(block.hash, '0x' + rlp.encode(getRawHeader(block)).toString('hex'));
    const submittedBlock = await relay.blocks(block.hash);

    assert.equal(block.stateRoot, submittedBlock[1].toString());
    assert.equal(block.transactionsRoot, submittedBlock[2].toString());
    assert.equal(block.receiptsRoot, submittedBlock[3].toString());
  });

  it("Get Transactions Root", async () => {
    const relay = await PeaceRelay.deployed();
    const txRoot = await relay.getTxRoot.call(block.hash);
    assert.equal(block.transactionsRoot, txRoot);
  });

  it("Get State Root", async () => {
    const relay = await PeaceRelay.deployed();
    const stateRoot = await relay.getStateRoot.call(block.hash);
    assert.equal(block.stateRoot, stateRoot);
  });

  it("Get Receipts Root", async () => {
    const relay = await PeaceRelay.deployed();
    const receiptsRoot = await relay.getReceiptRoot.call(block.hash);
    assert.equal(block.receiptsRoot, receiptsRoot);
  });

  it("Check transaction proof", async () => {

    
    const relay = await PeaceRelay.deployed();
    const bool = await relay.checkTxProof.call();
    
  });

  it("Check state proof", async () => {
    
  });

  it("Check receipts proof", async () => {
    
  });
});

function getRawHeader(_block) {
  if (typeof _block.difficulty != 'string') {
    _block.difficulty = '0x' + _block.difficulty.toString(16)
  }
  var block = new EthereumBlock(_block)
  return block.header.raw
}