var date = new Vue({
  delimiters: ['[[', ']]'],
  el: '#date',
  data: function() { 
          var positions = ['PG', 'SG', 'SF', 'PF', 'C'];
          var statLineColumns = ['Name', 'Team', 'Points', 'Minutes', 'Active', 'Salary', 'Positions', 'Minutes', 'Points'];
          var sortOrders = {};
          var sortKey = 'proj_minutes';
          var selectedSite = 'fd';
          var statLineColumnsTitles = ['Name', 'Team', 'Salary', 'Positions', 'Minutes', 'Points', 'Minutes', 'Points', 'Active'];
          var statLineColumnsSortKeys = ['name', 'abbrv', 'salary', 'positions', 'proj_minutes', 'proj_points', 'minutes', 'points', 'sl_active'];
          var statLineColumns = statLineColumnsTitles.map(function(e, i) {
            return { 'title': e, 'sortKey': statLineColumnsSortKeys[i]};
          });
          statLineColumns.forEach(function (key) {
            sortOrders[key.sortKey] = -1;
          });
          var excludedPlayerIds = [];
          var includedPlayerIds = [];
          var includedGames = [];
          var includedTeamAbbrvs = new Set(); // used for the split('-') team abbrvs
          var optimized = {};
          optimized['players'] = ['Jack', 'Other'];
          console.log(optimized);
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
            excludedPlayerIds: excludedPlayerIds,
            includedPlayerIds: includedPlayerIds,
            includedGames: includedGames,
            optimized: optimized,
          };
  },
  computed: {
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
          return this.includedTeamAbbrvs.has(row.abbrv);
        });
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
    optimize: function() {
      this.optimized = [];
      var date = this.date;
      var excludeSet = new Set();
      var includeSet = new Set();
      console.log(this.includedTeamAbbrvs);
      this.selectedStatLines.forEach((sl) => {
        if (!this.includedTeamAbbrvs.has(sl.abbrv)) {
          excludeSet.add(sl.pid)
        }
      });
      this.excludedPlayerIds.forEach((pid) => {
        excludeSet.add(pid);
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
          this.optimized = response.data;
        });
    },
  },
});
