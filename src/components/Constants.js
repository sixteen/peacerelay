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

const InfuraRopsten = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io"));
const InfuraKovan = new Web3(new Web3.providers.HttpProvider("https://kovan.infura.io"));

const PeacerelayABI = require('../../build/contracts/PeaceRelay.json').abi;
const ETCTokenABI = require('../../build/contracts/ETCToken.json').abi;
const ETCLockingABI = require('../../build/contracts/ETCLocking.json').abi;

var PeaceRelayRopstenContract = InfuraRopsten.eth.contract(PeacerelayABI);
var PeaceRelayKovanContract = InfuraKovan.eth.contract(PeacerelayABI);
var ETCTokenContract = InfuraRopsten.eth.contract(ETCTokenABI);
var ETCLockingContract = InfuraKovan.eth.contract(ETCLockingABI);
 
export const PEACE_RELAY_ADDRESS_ROPSTEN = settings['ropsten'].peaceRelayAddress
export const PEACE_RELAY_ADDRESS_KOVAN = settings['kovan'].peaceRelayAddress
export const ETC_TOKEN_ADDRESS = settings['ropsten'].etcTokenAddress
export const ETC_LOCKING_ADDRESS = settings['kovan'].etcLockingAddress
var PeaceRelayRopsten = PeaceRelayRopstenContract.at(PEACE_RELAY_ADDRESS_ROPSTEN)
var PeaceRelayKovan = PeaceRelayKovanContract.at(PEACE_RELAY_ADDRESS_KOVAN)
export var ETCToken = ETCTokenContract.at(ETC_TOKEN_ADDRESS)
export var ETCLocking = ETCLockingContract.at(ETC_LOCKING_ADDRESS)

const EpRopsten = new EP(new Web3.providers.HttpProvider("https://ropsten.infura.io"));
const EpKovan = new EP(new Web3.providers.HttpProvider("https://kovan.infura.io"));

export var EPs = {'kovan': EpKovan, 'ropsten': EpRopsten};
export var RELAYS = {'kovan': PeaceRelayKovan, 'ropsten': PeaceRelayRopsten};