import { observable, action, computed } from 'mobx'
import axios from 'axios'
import _ from 'lodash'

import SettingsStore from './SettingsStore'

class BalanceStore {
  constructor() {
    const start = () => {
      _.forEach(this.counters, (counter, key) => {
        if ( counter > 0 && (SettingsStore.fetchEnabled.value) ) {
          var [type, stock, accountId] = key.split('--')
          console.log(type, stock, accountId)

          this.fetchBalance(stock, key, type, accountId)
        }
      })
    }
    start()
    setInterval(() => {
      start()
    }, 2000)
  }

  @computed get terminalBackend() {return SettingsStore.terminalBackend.value }
  hashes = {}

  @observable precision = 8
  @observable balance = {}

  @action available(stock, pair, accountId) {
    try {
      var key = `now--${stock}--${accountId}`
      var current = pair.split('_')
      var availableBuy
      var availableSell
      if (this.balance[key] !== undefined && this.balance[key].data !== undefined) {
        availableBuy = _.find(this.balance[key].data, {'shortName': current[1]})
        availableSell = _.find(this.balance[key].data, {'shortName': current[0]})
      }
      return {
        buy: availableBuy ? availableBuy.free : 0,
        sell: availableSell ? availableSell.free : 0
      }
    }
    catch(err) {
      console.log(err)
      return {
        buy: availableBuy ? availableBuy.free : 0,
        sell: availableSell ? availableSell.free : 0
      }
    }
  }

  @action fetchBalance(stock, key, type, accountId){
    // axios.post(`/user-api/balance/${type}/${stock}`)
    axios.post(`/user-api/balance/`, {
     type, key, stock, accountId
    })
    .then(response => {
      if (this.hashes[key] === JSON.stringify(response.data)) return true
      this.hashes[key] = JSON.stringify(response.data)
      this.balance[key] = response.data
    })
    .catch(error => {
      this.balance[key] = 'error'
    })
  }

  counters = {}
  @action count(n, data) {
    const {type, stock, accountId} = data
    var key = `${type}--${stock}--${accountId}`
    if (this.balance[key] === undefined) this.balance[key] = {}
    if (this.counters[key] === undefined) this.counters[key] = 0
    this.counters[key] += n
    if (this.counters[key] === 0) {
      delete this.counters[key]
    }
  }
}

const store = window.BalanceStore = new BalanceStore()

export default store
