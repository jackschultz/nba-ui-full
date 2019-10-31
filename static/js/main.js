console.log('Hellp');

import axios from "axios";

var gvar = new Vue({
  delimiters: ['[[', ']]'],
  el: '#gapp',
  data: { games: ['MIL', 'HOU', 'GAS'], optimized: null },
  mounted () {
      axios
      .get('http://localhost:5000/optimize?date=2019-10-29&site=fd&version=0.1-avg-03')
      .then(response => (this.optimized = response));
  },
});
