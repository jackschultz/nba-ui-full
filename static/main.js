
Vue.component('simple-player-stat-line', {
  template: `<tr>
  <td>{{ player.name }}</td>
               <td>{{ player.pos }}</td>
               <td>{{ player.sal }}</td>
               <td>{{ player.pts }}</td>
             </tr>`,
  props: ['player'],
});

Vue.component('excluded-player-stat-line', {
  template: `<tr>
               <td>{{ player.name }}</td>
               <td>{{ player.team_abbrv }}</td>
               <td>{{ player.fd_positions }}</td>
               <td>{{ player.fd_salary }}</td>
               <td><button v-on:click="deExcludePlayer(player.pid)" class="btn btn-danger btn-sm action-btn">de-exclude</button></td>
             </tr>`,
  props: ['player'],
  methods: {
    deExcludePlayer: function(pid) {
      this.$parent.deExcludePlayer(pid);
    },
  },
});

Vue.component('included-player-stat-line', {
  template: `<tr>
               <td>{{ player.name }}</td>
               <td>{{ player.team_abbrv }}</td>
               <td>{{ player.fd_positions }}</td>
               <td>{{ player.fd_salary }}</td>
               <td><button v-on:click="deIncludePlayer(player.pid)" class="btn btn-sm btn-light action-btn">de-include</button></td>
             </tr>`,
  props: ['player'],
  methods: {
    deIncludePlayer: function(pid) {
      this.$parent.deIncludePlayer(pid);
    },
  },
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
          var statLineColumnsTitles = ['Name', 'Team', 'Salary', 'Positions', 'Minutes', 'Points', 'Minutes', 'Points', 'Active', 'Include', 'Exclude'];
          var statLineColumnsSortKeys = ['name', 'team_abbrv', 'salary', 'positions', 'proj_minutes', 'proj_points', 'minutes', 'points', 'sl_active', 'include', 'exclude'];
          var statLineColumns = statLineColumnsTitles.map(function(e, i) {
            return { 'title': e, 'sortKey': statLineColumnsSortKeys[i]};
          });
          statLineColumns.forEach(function (key) {
            sortOrders[key.sortKey] = -1;
          });
          var excludedPlayers = new Set();
          var excludedPlayersSetCount = 0;
          var includedPlayers = new Set();
          var includedPlayersSetCount = 0;
          var includedGames = [];
          var optimizedLineup = {players: []};
          return { 
            games: [],
            statLines: {},
            selectedStatLines: [],
            projectionVersions: ['0.1-dfn-min-avg-05'],
            selectedProjectionVersion: '0.1-dfn-min-avg-05' ,
            statLineColumns: statLineColumns,
            selectedSite: selectedSite,
            sortKey: sortKey,
            sortOrders: sortOrders,
            statLineColumnsSortKeys: statLineColumnsSortKeys,
            excludedPlayers: excludedPlayers,
            excludedPlayersSetCount: excludedPlayersSetCount,
            includedPlayers: includedPlayers,
            includedPlayersSetCount: includedPlayersSetCount,
            includedGames: includedGames,
            optimizedLineup: optimizedLineup,
          };
  },
  computed: {
    excludedStatLines: function () {
      var ssls = this.selectedStatLines;
      if(this.excludedPlayersSetCount) {
        ssls = ssls.filter((row) => {
          return this.excludedPlayers.has(row.pid);
        });
      return ssls;
    }
    },
    includedStatLines: function () {
      var ssls = this.selectedStatLines;
      if(this.includedPlayersSetCount) {
        ssls = ssls.filter((row) => {
          return this.includedPlayers.has(row.pid);
        });
      return ssls;
    }
    },
    filteredSelectedStatLines: function () {
      var sortKey = this.sortKey;
      var ssls = this.selectedStatLines;
      var order = this.sortOrders[sortKey] || -1;
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
      if(this.includedGames) {
        this.includedTeamAbbrvs = new Set();
        this.includedGames.map((game) => {
          game.split('-').forEach((et) => {
            this.includedTeamAbbrvs.add(et);
          });
        });
        ssls = ssls.filter((row) => {
          return this.includedTeamAbbrvs.has(row.team_abbrv);
        });
      }
      if(this.excludedPlayersSetCount) {
          ssls = ssls.filter((row) => {
          return !this.excludedPlayers.has(row.pid);
        });
      }
      return ssls;
    },
    optimizedLineupPlayers: function () {
      console.log(this.optimizedLineup);
      if ('players' in this.optimizedLineup) {
        return this.optimizedLineup.players;
      }
      else {
        return [];
      }
    },
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
        .then((response) => {
          this.games = response.data;
          this.includedGames = [];
          this.games.forEach((game) => {
            return this.includedGames.push(this.gameAbbrv(game));
          });
        });
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
      this.statLineColumnsSortKeys.forEach((slcsk) => {
        if (slcsk !== key) { sortOrders[slcsk] = 1; } else { sortOrders[key] = sortOrders[key] * -1; };
      });
      this.sortOrders = sortOrders;
      console.log(this.sortOrders);
    },
    gameAbbrv: function(game) {
      return game.home_team_abbrv + '-' + game.away_team_abbrv
    },
    excludePlayer: function(pid) {
      this.excludedPlayers.add(pid);
      this.excludedPlayersSetCount += 1;
    },
    deExcludePlayer: function(pid) {
      this.excludedPlayers.delete(pid);
      this.excludedPlayersSetCount += 1;
    },
    includePlayer: function(pid) {
      this.includedPlayers.add(pid);
      this.includedPlayersSetCount += 1;
    },
    deIncludePlayer: function(pid) {
      this.includedPlayers.delete(pid);
      this.includedPlayersSetCount += 1;
    },
    optimize: function() {
      this.optimizedLineup = [];
      var date = this.date;
      var excludeSet = new Set();
      var includeSet = new Set();
      console.log(this.includedTeamAbbrvs);
      this.selectedStatLines.forEach((sl) => {
        if (!this.includedTeamAbbrvs.has(sl.team_abbrv)) {
          excludeSet.add(sl.pid)
        }
      });
      this.excludedPlayers.forEach((pid) => {
        excludeSet.add(pid);
      });
      this.includedPlayers.forEach((pid) => {
        includeSet.add(pid);
      });
      var version = this.selectedProjectionVersion;
      var site = this.selectedSite;
      var excludes = Array.from(excludeSet);
      var includes = Array.from(includeSet);
      axios({
        method: 'get',
        url: 'http://localhost:5000/optimize',
        headers: { 'Content-type': 'application/json' },
        params: { date: date, site: site, version: version, exclude: excludes, include: includes },
        paramsSerializer: (params) => {
          return Qs.stringify(params, {arrayFormat: 'repeat'});
        }
      })
        .then((response) => {
          this.optimizedLineup = response.data;
        });
    },
  },
});
