import { PeaceRelayABI, ETCTokenABI, ETCLockingABI,
    ETC_TOKEN_ADDRESS, PEACE_RELAY_ADDRESS_ROPSTEN, PEACE_RELAY_ADDRESS_KOVAN, ETC_LOCKING_ADDRESS } from '../components/Constants'

export default function reducer(state={
    ETCToken: '',
    ETCLocking: '',
    PeaceRelayKovan: '',
    PeaceRelayRopsten: ''
  }, action) {
      switch (action.type) {
          case "WEB3_INJECTED": {
              let web3 = action.payload,
              ETCToken = web3.eth.contract(ETCTokenABI).at(ETC_TOKEN_ADDRESS),
              ETCLocking = web3.eth.contract(ETCLockingABI).at(ETC_LOCKING_ADDRESS),
              PeaceRelayKovan = web3.eth.contract(PeaceRelayABI).at(PEACE_RELAY_ADDRESS_KOVAN),
              PeaceRelayRopsten = web3.eth.contract(PeaceRelayABI).at(PEACE_RELAY_ADDRESS_ROPSTEN),
              RelayEvent = PeaceRelayRopsten.SubmitBlock({}, {fromBlock: 2922963, toBlock:"latest"})
              console.log(RelayEvent)
              RelayEvent.watch(function(err, result) {
                if(!err) {
                  console.log(result)
                } else {
                  console.log(err)
                }
              })

              return {
                  ...state,
                  ETCToken: ETCToken,
                  ETCLocking: ETCLocking,
                  PeaceRelayKovan: PeaceRelayKovan,
                  PeaceRelayRopsten: PeaceRelayRopsten
              }
          }
      }
      return state
  }