pragma solidity ^0.4.11;

import "./RLP.sol";
import "./MerklePatriciaProof.sol";

contract PeaceRelay {
  using RLP for RLP.RLPItem;
  using RLP for RLP.Iterator;
  using RLP for bytes;

  uint[] tips;
  uint256 public highestBlock;

  mapping (address => bool) authorized;
  mapping (uint256 => BlockHeader) public blocks;
  
  mapping (uint256 => bool) tip;
  mapping (uint256 => bool) exists;


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
  event SubmitBlock(uint256 blockHash, address submitter);

  function PeaceRelay(uint256 blockNumber, uint256 blockHash, bytes rlpHeader) {
    highestBlock = blockNumber;
    exists[blockHash] = true;
    tip[blockHash] = true;
    BlockHeader memory header = parseBlockHeader(rlpHeader);
    blocks[blockHash] = header;
    authorized[msg.sender] = true;
  }

  function authorize(address user) onlyAurhorized {
    authorized[user] = true;
  }

  function submitBlock(uint256 blockHash, bytes rlpHeader) onlyAurhorized {
    BlockHeader memory header = parseBlockHeader(rlpHeader);
    uint256 blockNumber = getBlockNumber(rlpHeader);
    require(exists[header.prevBlockHash]);
    if (tip[header.prevBlockHash]) {
      tip[header.prevBlockHash] = false;
    }
    if (blockNumber > highestBlock) {
      highestBlock = blockNumber;
    }
    tip[blockHash] = true;
    exists[blockHash] = true;
    blocks[blockHash] = header;
    // There is at least one orphan
    SubmitBlock(blockHash, msg.sender);
  }

  function checkTxProof(bytes value, uint256 blockHash, bytes path, bytes parentNodes) constant returns (bool) {
    // add fee for checking transaction
    bytes32 txRoot = blocks[blockHash].txRoot;
    TxRootEvent(txRoot);
    return trieValue(value, path, parentNodes, txRoot);
  }

  // TODO: test
  function checkStateProof(bytes value, uint256 blockHash, bytes path, bytes parentNodes) constant returns (bool) {
    bytes32 stateRoot = blocks[blockHash].stateRoot;
    return trieValue(value, path, parentNodes, stateRoot);
  }

  // TODO: test
  function checkReceiptProof(bytes value, uint256 blockHash, bytes path, bytes parentNodes) constant returns (bool) {
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

  function getStateRoot(uint256 blockHash) constant returns (bytes32) {
    return blocks[blockHash].stateRoot;
  }

  function getTxRoot(uint256 blockHash) constant returns (bytes32) {
    return blocks[blockHash].txRoot;
  }

  function getReceiptRoot(uint256 blockHash) constant returns (bytes32) {
    return blocks[blockHash].receiptRoot;
  }

  function trieValue(bytes value, bytes encodedPath, bytes parentNodes, bytes32 root) constant internal returns (bool) {
    return MerklePatriciaProof.verify(value, encodedPath, parentNodes, root);
  }

}
