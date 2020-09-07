
Vue.component('lineup-players', {
  template: `<tr>
               <td>{{ lineup.act_pts }}</td>
             </tr>`,
  props: ['lineup'],
});


window.addEventListener('load', function () {

  var date = new Vue({
    delimiters: ['[[', ']]'],
    el: '#date',
    data: function() {
            var positions = ['PG', 'SG', 'SF', 'PF', 'C'];
            //var statLineColumns = ['Name', 'Team', 'Points', 'Minutes', 'Value', 'Active', 'Salary', 'Positions', 'Minutes', 'Points'];
            var sortOrders = {};
            var sortKey = 'proj_minutes';
            var selectedSite = 'fd';
            var statLineColumnsTitles = ['Name', 'Salary', 'Positions', 'Active', 'Minutes', 'Points', 'Points STD', 'Point %', 'Point % STD', 'Pts High', 'Pts Low', 'Minutes', 'Points'];
            var statLineColumnsSortKeys = ['player_name', 'salary', 'positions', 'proj_active', 'proj_minutes', 'proj_points', 'proj_pts_std', 'proj_pts_pct', 'proj_pts_pct_std', 'proj_pts_high', 'proj_pts_low','minutes', 'points'];
            var statLineColumns = statLineColumnsTitles.map(function(e, i) {
              return { 'title': e, 'sortKey': statLineColumnsSortKeys[i]};
            });
            statLineColumns.forEach(function (key) {
              sortOrders[key.sortKey] = -1;
            });

            var projectionVersions = ['self'];
            var selectedProjectionVersion = ['self'];
            var excludedPlayers = new Set();
            var gameTeamProjections = [];
            var lineups = [];
            var optimizedLineup = {players: []};
            return {
              games: [],
              statLines: {},
              selectedStatLines: [],
              projectionVersions: projectionVersions,
              selectedProjectionVersion: selectedProjectionVersion,
              statLineColumns: statLineColumns,
              selectedSite: selectedSite,
              sortKey: sortKey,
              sortOrders: sortOrders,
              statLineColumnsSortKeys: statLineColumnsSortKeys,
              optimizedLineup: optimizedLineup,
              gameTeamProjections: gameTeamProjections,
              lineups: lineups,
            };
    },
    computed: {
    },
    mounted () {
      this.date = this.$el.getAttribute('data-date');
      this.starter(this.date);
    },
    methods: {
      teamProjMinSum: function(team) {
        var retval = 0;
        team.stat_line_calcs.forEach((slc) => {
          retval += slc.projections.edited_minutes;
        });
        return retval;
      },
      getLineups: function(user_id, date) {
        axios({
          method: 'get',
          url: 'http://localhost:5000/lineups',
          headers: { 'Content-type': 'application/json' },
          params: { user_id: user_id, date: date }})
          .then((response) => {
            console.log(response.data);
            this.lineups = response.data;
          });
      },
      getGameTeamProjections: function(date) {
        axios({
          method: 'get',
          url: 'http://localhost:5000/stat_line_projections',
          headers: { 'Content-type': 'application/json' },
          params: { date: date }})
          .then((response) => {
            console.log(response.data);
            response.data.forEach((rd) => { // doing some calcs
              rd.away_team.stat_line_calcs.forEach((slc) => {
                Vue.set(slc.projections, 'edited_minutes', slc.projections.minutes);
              });
              rd.home_team.stat_line_calcs.forEach((slc) => {
                Vue.set(slc.projections, 'edited_minutes', slc.projections.minutes);
              });
            });
            this.gameTeamProjections = response.data;
          });
      },
      starter: function(date) {
        this.getGameTeamProjections(date);
        var user_id = 1; // hard coding this
        this.getLineups(user_id, date);
      },
      sortBy: function (key) {
        this.sortKey = key;
        var sortOrders = this.sortOrders;
        this.statLineColumnsSortKeys.forEach((slcsk) => {
          if (slcsk !== key) { sortOrders[slcsk] = 1; } else { sortOrders[key] = sortOrders[key] * -1; }
        });
        this.sortOrders = sortOrders;
      },
      editTeamProjections: function(team) {
        console.log('editing', team);
        Vue.set(team, 'editing', true);
      },
      saveTeamProjections: function(team) {
        console.log('saving', team);
        Vue.set(team, 'editing', false);
        var data = team.stat_line_calcs.map(function(slc) {
          var proj = slc.projections;
          return {
            id: proj.id,
            active: proj.active,
            minutes: proj.edited_minutes,
          };
        });
        axios({
          method: 'POST',
          url: 'http://localhost:5000/stat_line_projections',
          headers: { 'Content-type': 'application/json' },
          data: data })
          .then((response) => {
            Vue.set(team, 'editing', false);
            console.log('saved');

            // reset the minutes and other variables
            this.gameTeamProjections.forEach((rd) => { // doing some calcs
              rd.away_team.stat_line_calcs.forEach((slc) => {
                Vue.set(slc.projections, 'minutes', parseFloat(slc.projections.edited_minutes));
              });
              rd.home_team.stat_line_calcs.forEach((slc) => {
                Vue.set(slc.projections, 'minutes', parseFloat(slc.projections.edited_minutes));
              });
            });

            console.log(response.data);
          });
      },
      orderTeamStatLines: function (team, tsls) {
        var sortKey = this.sortKey;
        var order = this.sortOrders[sortKey] || -1;
        var projectionSort = false;
        if (sortKey) {
          if (sortKey.includes('proj_')) {
            projectionSort = true;
            sortKey = sortKey.replace('proj_', ''); // this is because the ones in projections don't have the proj_ like needed for sort
          }
          if ( ['points', 'pts_pct', 'positions', 'salary', 'points', 'pts_pct', 'pts_pct_std', 'pts_std', 'pts_high', 'pts_low'].includes(sortKey)) {
            sortKey = this.selectedSite + '_' + sortKey;
          }
          if (tsls) {
            tsls = tsls.slice().sort(function (a, b) {
              if (projectionSort) {
                a = a.projections;
                b = b.projections;
              }
              a = a[sortKey];
              b = b[sortKey];
              return (a === b ? 0 : a > b ? 1 : -1) * order;
            });
          }
        }
        return tsls;
      },
      gameAbbrv: function(game) {
        return game.home_team_abbrv + '-' + game.away_team_abbrv;
      },
      optimize: function() {
        this.optimizedLineup = [];
        var date = this.date;
        var excludeSet = new Set();
        var includeSet = new Set();
        console.log(this.includedTeamAbbrvs);
        this.selectedStatLines.forEach((sl) => {
          if (!this.includedTeamAbbrvs.has(sl.team_abbrv)) {
            excludeSet.add(sl.pid);
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
});
