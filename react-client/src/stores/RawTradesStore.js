import { observable, action, computed, autorun } from 'mobx'
import axios from 'axios'
import _ from 'lodash'
import OrdersStore from './OrdersStore'

class RawTradesStore {
  @computed get stock() {return OrdersStore.stock }
  @computed get pair() {return OrdersStore.pair }
  // @observable stock = 'LIQUI'
  // @observable pair = 'ETH_BTC'
  @observable rawTrades = []

  @action fetchRawTrades(){
    axios.get(`http://localhost:8051/trades/${this.stock}/${this.pair}`)
    .then((response) => {
      // response.data
      // this.rawTrades = response.data
      var data = [...response.data.data.buy, ...response.data.data.sell]
      this.rawTrades = _.orderBy(data, ['timestamp'], ['desc'])

    })
    .catch((error) => { console.log(error) })
  }


}

const store = window.RawTradesStore = new RawTradesStore()

export default store

autorun(() => {
  console.log(store.stock)
  console.log(store.pair)
  store.fetchRawTrades()
})