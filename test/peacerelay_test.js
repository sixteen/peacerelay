var PrRelayer = require('../peacerelay.js');
var PrContract = artifacts.require("./PeaceRelay.sol");
const Web3 = require('web3');
const EP = require('eth-proof');
const eP = new EP(new Web3.providers.HttpProvider("https://kovan.infura.io"));

function fetchAndVerifyProof(peaceRelay, txHash) {
	return new Promise((resolve, reject) => {
		return eP.getTransactionProof(txHash).then((proof) => {
					console.log("GOGO");
					peaceRelay.submitBlock.call(proof.blockHash.toString('hex'),
											   	proof.header.toString('hex'));
					console.log(peaceRelay.blocks[proof.blockHash.toString('hex')]);
	  				resolve(peaceRelay.checkTxProof.call(proof.value.toString('hex'), 
								  					  			proof.blockHash.toString('hex'),
													  			proof.path.toString('hex'), 
							    					  			proof.parentNodes.toString('hex'))); })
	  										 .catch((e) => {reject(e);});
	});										
}

function submitBlock(peaceRelay, txHash) {
	return new Promise((resolve, reject) => {
		return eP.getTransactionProof(txHash).then((proof) => {
			console.log("A");
			console.log(peaceRelay.blocks[proof.blockHash.toString('hex')]);
			console.log(proof.blockHash.toString('hex'));
			console.log(peaceRelay.getTxRoot('1234'));
			resolve(peaceRelay.submitBlock.call(proof.blockHash.toString('hex'),
											   	proof.header.toString('hex')));
			console.log(peaceRelay.getTxRoot(proof.blockHash.toString('hex'))); })
											  .catch((e) => {reject(e);});

	});
}


describe("Test", function() {
  var peacerelay;
  describe("Submit block", function() {
  	it("should submit", function() {
  		this.timeout(60000);
  		PrRelayer('kovan', 'ropsten', 1);

  		return submitBlock(PrRelayer.PeaceRelayTo, tx1.txHash)
  		.then((res) => {})
  		.catch((e) => {console.log(e);});
  	});
  });

  describe("Verify proof", function() {
  	it("should verify the proof", function() {
		this.timeout(10000);
  		PrRelayer('kovan', 'ropsten', 1);

  		return fetchAndVerifyProof(PrRelayer.PeaceRelayTo, tx1.txHash)
  		.then((res) => {
  			console.log("WRONG");
  			assert.equal(res, true, 'wrong roi');
  		}).catch((e) => {console.log(e);});
  	});
  });
});




var tx1 = { blockhash: '0xf82990de9b368d810ce4b858c45717737245aa965771565f8a41df4c75acc171',
  header: '0xf90217a005e37f4ea28008554ea6f332e70e556d994c7fe14854563a811e58131dcb36e8a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347941e9939daaad6924ad004c2560e90804164900341a04914025aa9ea9f274b174205adde3243eec74589bef9a0e78a433763b2f8caa3a076de858022a0904dbc0d6ed58f42423abe3b3ced468f81636d52c74d2186efa3a0ba4f6879d2ccd6eec8351435f78d3da607b33d82bac26583ecc79a74a7485299b9010080080000008000000000000000000002000000014400008000100400002001080000800004000100008000040080410008000000400000000000000000008080800008400008000000000008000010000001000000000000080000000000000000000030000000000000104000000000000004000004080000001010000004600000020080000200080000000000000000000000000c0000000000200000010000400000200000000040000000010000000c04800000800000100001000040000004000204000000200000000020000000800004000c20002000000000040001010000080010000004000000000000000000000044400000000002000080400087037b56173c36b2833c5e8683666c488310bfad845957394e96706f6f6c2e65746866616e732e6f726720284d4e3729a0673c72b485df4da9e90a0101fa664792b10b3e7086f31737e87e6810a2608a1088f326a04006c213c0',
  stateRoot: '0x4914025aa9ea9f274b174205adde3243eec74589bef9a0e78a433763b2f8caa3',
  txRoot: '0x76de858022a0904dbc0d6ed58f42423abe3b3ced468f81636d52c74d2186efa3',
  receiptRoot: '0xba4f6879d2ccd6eec8351435f78d3da607b33d82bac26583ecc79a74a7485299',
  stack: '0xf90106f891a0e689a95524285e09f8ecc6b54109f1b8bacf8f3620a27bbb5f8a423be160e343a0f58ed79964e37302cf24967ee7177f1b8f703eb3adbc6f50fa42e56c12db8caca052d1f0f14af906e982f194b621f4cd8e6b8a78199e9489ff2e45bdfc5ec988258080808080a01e51b4181e4ab8bbb9b0807d875c8d9113443595334f34b773b6b3c2128d1ac28080808080808080f87130b86ef86c80850df847580082520894b56d622ddf60ec532b5f43b4ff9b0e7b1ff92db3883782dace9d9000008025a03c76c52993d9519cbcff2abeed7c1a62f81d83072fd0b6c245e6138e6088d313a0674e59dd82cfe38e1ae326796060df3fb776e890508a80343b1d98f3a70dab41',
  path: [ 8, 1 ],
  value: '0xf86c80850df847580082520894b56d622ddf60ec532b5f43b4ff9b0e7b1ff92db3883782dace9d9000008025a03c76c52993d9519cbcff2abeed7c1a62f81d83072fd0b6c245e6138e6088d313a0674e59dd82cfe38e1ae326796060df3fb776e890508a80343b1d98f3a70dab41',
  prefix: '0xb86e',
  txHash: '0xcba7627b711dcd361fd2493cae0c97438cfd644920c1ec845548157a7e8b3fe6'};

