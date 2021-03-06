import { observable, action, computed } from 'mobx'
import axios from 'axios'
import uuidv1 from 'uuid/v1'
import _ from 'lodash'

import DashboardsStore from './DashboardsStore'
import SettingsStore from './SettingsStore'

class OrdersStore {
  constructor() {
    const start = () => {
      _.forEach(this.counters, (counter, key) => {
        var [stock, pair] = key.split('--')
        if ( counter > 0 && (SettingsStore.fetchEnabled.value) ) this.fetchOrders(stock, pair)
      })
    }
    start()
    setInterval(() => {
      start()
    }, 1000)
  }
  @computed get stock() {return DashboardsStore.stock }
  @computed get stockLowerCase() {return DashboardsStore.stockLowerCase }
  @computed get pair() {return DashboardsStore.pair }
  @computed get serverBackend() {return SettingsStore.serverBackend.value }

  hashes = {}
  @observable orders = {}

  @action async fetchOrders(stock, pair) {
    var stockLowerCase = stock.toLowerCase()
    var key = `${stock}--${pair}`
    axios.get(`${this.serverBackend}/${stockLowerCase}/orders/${pair}`)
    .then((response) => {
      if (this.hashes[key] === JSON.stringify(response.data)) return true
      this.hashes[key] = JSON.stringify(response.data)
      var _orders = response.data
      var sum = {asks: 0, bids: 0}

      for( let type of Object.keys(sum) ) {
        for( let [key, order] of Object.entries(_orders[type]) ) {
          var price = order[0]
          var amount = order[1]
          var total = price * amount
          sum[type] = total + sum[type]
          _orders[type][key] = {
            id: uuidv1(),
            price: price,
            amount: amount,
            total: total,
            sum: sum[type]
          }
        }
        _orders[type] = _.forEach(_orders[type], (order)=>{
          order.totalPercent = order.total / sum[type] * 100
          order.sumPercent = order.sum / sum[type] * 100
          order.totalPercentInverse = 100 - order.totalPercent
          order.sumPercentInverse = 100 - order.sumPercent
        })
      }
      this.orders[key] = _orders
    })
    .catch((error) => {
      this.orders[key] = {
        'asks': [],
        'bids': []
      }
    })
  }

  counters = {}
  @action count(n, data) {
    var key = `${data.stock}--${data.pair}`
    if (this.orders[key] === undefined) this.orders[key] = []
    if (this.counters[key] === undefined) this.counters[key] = 0
    this.counters[key] += n
    if (this.counters[key] === 0) {
      delete this.counters[key]
    }
  }
}

const store = window.OrdersStore = new OrdersStore()

export default store
