console.log('Running main');

var games = new Vue({
  delimiters: ['[[', ']]'],
  el: '#gapp',
  data: { games: ['MIL', 'HOU', 'GAS'], optimized: null },
  mounted () {
      axios
      .get('http://localhost:5000/optimize?date=2019-10-29&site=fd&version=0.1-avg-03')
      .then(response => (this.optimized = response));
  },
});
var date = new Vue({
  delimiters: ['[[', ']]'],
  el: '#date',
  data: { games: {}, optimized: null },
  mounted () {
      axios
      .get('http://localhost:5000/optimize?date=2019-10-29&site=fd&version=0.1-avg-03')
      .then(response => (this.optimized = response));
      axios
      .get('http://localhost:5001/games?date=2019-10-29')
      .then(response => (this.games = response.data));
  },
});
