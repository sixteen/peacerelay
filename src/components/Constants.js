export const MAIN_NETWORK_ID = "1"
export const MORDEN_NETWORK_ID = "2"
export const ROPSTEN_NETWORK_ID = "3"
export const RINKEBY_NETWORK_ID = "4"
export const KOVAN_NETWORK_ID = "42"
export const MAX_ATTEMPTS = 100
export const ROPSTEN_ETHERSCAN_LINK = "https://ropsten.etherscan.io/tx/"
export const KOVAN_ETHERSCAN_LINK = "https://ropsten.etherscan.io/tx/"

export const RIGHT_NETWORK_IDS = [ROPSTEN_NETWORK_ID, KOVAN_NETWORK_ID]
export const METAMASK_NOT_FOUND = 0

var settings = require('../../cli/settings.json')
var EP = require('eth-proof')
var Web3 = require('web3')

export const InfuraRopsten = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io"));
export const InfuraKovan = new Web3(new Web3.providers.HttpProvider("https://kovan.infura.io"));

export const PeaceRelayABI = require('../../build/contracts/PeaceRelay.json').abi;
export const ETCTokenABI = require('../../build/contracts/ETCToken.json').abi;
export const ETCLockingABI = require('../../build/contracts/ETCLocking.json').abi;
 
export const PEACE_RELAY_ADDRESS_ROPSTEN = settings['ropsten'].peaceRelayAddress
export const PEACE_RELAY_ADDRESS_KOVAN = settings['kovan'].peaceRelayAddress
export const ETC_TOKEN_ADDRESS = settings['ropsten'].etcTokenAddress
export const ETC_LOCKING_ADDRESS = settings['kovan'].etcLockingAddress

var PeaceRelayRopstenContract = InfuraRopsten.eth.contract(PeaceRelayABI);
var PeaceRelayKovanContract = InfuraKovan.eth.contract(PeaceRelayABI);
var ETCTokenContract = InfuraRopsten.eth.contract(ETCTokenABI);
var ETCLockingContract = InfuraKovan.eth.contract(ETCLockingABI);

export var PeaceRelayRopsten = PeaceRelayRopstenContract.at(PEACE_RELAY_ADDRESS_ROPSTEN)
export var PeaceRelayKovan = PeaceRelayKovanContract.at(PEACE_RELAY_ADDRESS_KOVAN)
export var ETCToken = ETCTokenContract.at(ETC_TOKEN_ADDRESS)
export var ETCLocking = ETCLockingContract.at(ETC_LOCKING_ADDRESS)

export const EpRopsten = new EP(new Web3.providers.HttpProvider("https://ropsten.infura.io"));
export const EpKovan = new EP(new Web3.providers.HttpProvider("https://kovan.infura.io"));

export var EPs = {'kovan': EpKovan, 'ropsten': EpRopsten};