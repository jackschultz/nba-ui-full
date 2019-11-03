
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
  data: function() { 
          var positions = ['PG', 'SG', 'SF', 'PF', 'C'];
          var statLineColumns = ['Name', 'Team', 'Points', 'Minutes', 'Active', 'Salary', 'Positions', 'Minutes', 'Points'];
          var sortOrders = {};
          var sortKey = 'proj_minutes';
          var selectedSite = 'fd';
          var statLineColumnsTitles = ['Name', 'Team', 'Points', 'Minutes', 'Active', 'Salary', 'Positions', 'Minutes', 'Points'];
          var statLineColumnsSortKeys = ['name', 'abbrv', 'points', 'minutes', 'sl_active', 'salary', 'positions', 'proj_minutes', 'proj_points'];
          var statLineColumns = statLineColumnsTitles.map(function(e, i) {
            return { 'title': e, 'sortKey': statLineColumnsSortKeys[i]};
          });
          statLineColumns.forEach(function (key) {
            sortOrders[key.sortKey] = -1;
          });
          return { 
            games: [],
            statLines: {},
            selectedStatLines: [],
            projectionVersions: ['0.1-avg-dfn-min-05'],
            selectedProjectionVersion: '0.1-avg-dfn-min-05' ,
            statLineColumns: statLineColumns,
            selectedSite: selectedSite,
            sortKey: sortKey,
            sortOrders: sortOrders,
            statLineColumnsSortKeys: statLineColumnsSortKeys,
          };
  },
  computed: {
    filteredSelectedStatLines: function () {
      var sortKey = this.sortKey;
      var ssls = this.selectedStatLines;
      var order = this.sortOrders[sortKey] || -1;
      console.log(this.sortOrders);
      if (sortKey) {
        if ( ['points', 'positions', 'salary', 'proj_points'].includes(sortKey)) {
          sortKey = this.selectedSite + '_' + sortKey;
        }
        console.log(sortKey);
        if (ssls) {
          ssls = ssls.slice().sort(function (a, b) {
            a = a[sortKey];
            b = b[sortKey];
            return (a === b ? 0 : a > b ? 1 : -1) * order;
          });
        }
      }
      return ssls;
    }
  },
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
        params: { date: date, version: this.selectedProjectionVersion }})
        .then((response) => { this.selectedStatLines = response.data;
                              this.statLines[this.selectProjectionVersion] = response.data;
                             });
    },
    getProjectionVersions: function(date) {
      axios({
        method: 'get',
        url: 'http://localhost:5001/versions',
        headers: { 'Content-type': 'application/json' }})
        .then((response) => { this.projectionVersions = response.data });
    },
    selectedNewVersion: function(event) {
      this.selectedProjectionVersion = event.target.value;
      this.getStatLines(this.date);
    },
    starter: function(date) {
      this.getGames(date);
      this.getStatLines(date);
      this.getProjectionVersions(date);
    },
    sortBy: function (key) {
      this.sortKey = key;
      console.log(this.sortOrders);
      var sortOrders = this.sortOrders;
      this.statLineColumnsSortKeys.forEach(function(slcsk) {
        if (slcsk !== key) { sortOrders[slcsk] = 1; } else { sortOrders[key] = sortOrders[key] * -1; };
      });
      this.sortOrders = sortOrders;
      console.log(this.sortOrders);
    },
  },
});
