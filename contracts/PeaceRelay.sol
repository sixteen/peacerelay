pragma solidity ^0.4.11;

import "./RLP.sol";
import "./MerklePatriciaProof.sol";

contract PeaceRelay {
  using RLP for RLP.RLPItem;
  using RLP for RLP.Iterator;
  using RLP for bytes;

  uint[] public tips;

  uint public highestBlock;
  uint public genesisBlock;

  mapping (address => bool) authorized;
  mapping (bytes32 => BlockHeader) public blocks;
  
  mapping (uint => bool) public tip;
  mapping (uint => bool) public exists;

  mapping (bytes32 => uint) blockHashToNumber;

  modifier onlyAurhorized() {
    if (authorized[msg.sender])
      _;
  }

  struct BlockHeader {
    uint      prevBlockHash; // 0
    bytes32   stateRoot;     // 3
    bytes32   txRoot;        // 4
    bytes32   receiptRoot;   // 5
  }



  event TxRootEvent(bytes32 txRoot);
  event SubmitBlock(bytes32 blockHash, address submitter);

  function PeaceRelay(uint blockNumber) {
    highestBlock = blockNumber;
    genesisBlock = blockNumber;
    authorized[msg.sender] = true;
  }

  function authorize(address user) onlyAurhorized {
    authorized[user] = true;
  }

  function submitBlock(bytes32 blockHash, bytes rlpHeader) onlyAurhorized {
    BlockHeader memory header = parseBlockHeader(rlpHeader);
    var blockNumber = getBlockNumber(rlpHeader);

    require(exists[header.prevBlockHash] || blockNumber == genesisBlock);

    if (blockNumber > highestBlock) {
      highestBlock = blockNumber;
    } 
    
    if (tip[header.prevBlockHash]) {
      tip[header.prevBlockHash] = false;
    }
    blocks[blockHash] = header;
    // There is at least one orphan
    SubmitBlock(blockHash, msg.sender);
  }

  function checkTxProof(bytes value, bytes32 blockHash, bytes path, bytes parentNodes) constant returns (bool) {
    // add fee for checking transaction
    bytes32 txRoot = blocks[blockHash].txRoot;
    TxRootEvent(txRoot);
    return trieValue(value, path, parentNodes, txRoot);
  }

  // TODO: test
  function checkStateProof(bytes value, bytes32 blockHash, bytes path, bytes parentNodes) constant returns (bool) {
    bytes32 stateRoot = blocks[blockHash].stateRoot;
    return trieValue(value, path, parentNodes, stateRoot);
  }

  // TODO: test
  function checkReceiptProof(bytes value, bytes32 blockHash, bytes path, bytes parentNodes) constant returns (bool) {
    bytes32 receiptRoot = blocks[blockHash].receiptRoot;
    return trieValue(value, path, parentNodes, receiptRoot);
  }

  // parse block header
  function parseBlockHeader(bytes rlpHeader) constant internal returns (BlockHeader) {
    BlockHeader memory header;
    var it = rlpHeader.toRLPItem().iterator();

    uint idx;
    while (it.hasNext()) {
      if (idx == 0) {
        header.prevBlockHash = it.next().toUint();
      } else if (idx == 3) {
        header.stateRoot = bytes32(it.next().toUint());
      } else if (idx == 4) {
        header.txRoot = bytes32(it.next().toUint());
      } else if (idx == 5) {
        header.receiptRoot = bytes32(it.next().toUint());
      } else {
        it.next();
      }
      idx++;
    }
    return header;
  }

  function getBlockNumber(bytes rlpHeader) constant internal returns (uint blockNumber) {
    RLP.RLPItem[] memory rlpH = RLP.toList(RLP.toRLPItem(rlpHeader));
    blockNumber = RLP.toUint(rlpH[8]);
  }

  function getStateRoot(bytes32 blockHash) constant returns (bytes32) {
    return blocks[blockHash].stateRoot;
  }

  function getTxRoot(bytes32 blockHash) constant returns (bytes32) {
    return blocks[blockHash].txRoot;
  }

  function getReceiptRoot(bytes32 blockHash) constant returns (bytes32) {
    return blocks[blockHash].receiptRoot;
  }

  function trieValue(bytes value, bytes encodedPath, bytes parentNodes, bytes32 root) constant internal returns (bool) {
    return MerklePatriciaProof.verify(value, encodedPath, parentNodes, root);
  }

}
