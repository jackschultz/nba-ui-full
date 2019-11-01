
Vue.component('demo-grid', {
  template: '#grid-template',
  props: {
    players: Array,
    columns: Array,
    filterKey: String
  },
  data: function () {
    var sortOrders = {}
    this.columns.forEach(function (key) {
      sortOrders[key] = 1
    })
    return {
      sortKey: '',
      sortOrders: sortOrders
    }
  },
  computed: {
    filteredplayers: function () {
      var sortKey = this.sortKey
      var filterKey = this.filterKey && this.filterKey.toLowerCase()
      var order = this.sortOrders[sortKey] || 1
      var players = this.players
      if (filterKey) {
        players = players.filter(function (row) {
          return Object.keys(row).some(function (key) {
            return String(row[key]).toLowerCase().indexOf(filterKey) > -1
          })
        })
      }
      if (sortKey) {
        players = players.slice().sort(function (a, b) {
          a = a[sortKey]
          b = b[sortKey]
          return (a === b ? 0 : a > b ? 1 : -1) * order
        })
      }
      return players
    }
  },
  filters: {
    capitalize: function (str) {
      return str.charAt(0).toUpperCase() + str.slice(1)
    }
  },
  methods: {
    sortBy: function (key) {
      this.sortKey = key
      this.sortOrders[key] = this.sortOrders[key] * -1
    }
  }
});


var date = new Vue({
  delimiters: ['[[', ']]'],
  el: '#date',
  data: { games: [], stat_lines: []},
  mounted () {
    this.date = this.$el.getAttribute('data-date');
    this.starter(this.date);
  },
  methods: {
    getGames: function(date) {
      axios({
        method: 'get',
        url: 'http://localhost:5001/games',
        headers: { 'Content-type': 'application/json' },
        params: { date: date }})
        .then((response) => { this.games = response.data });
    },
    getStatLines: function(date) {
      axios({
        method: 'get',
        url: 'http://localhost:5001/stat_lines',
        headers: { 'Content-type': 'application/json' },
        params: { date: date }})
        .then((response) => { this.stat_lines = response.data });
    },
    starter: function(date) {
      this.getGames(date);
      this.getStatLines(date);
    },
  },
  created () {
  },
});
