/**
 * @param {function(Array)} callback
 */
gs.getTeamsList = function(callback) {
  gs.apiRequest('/orgs/LiveTex/teams', function(teams) {
    callback(teams);
  });
};


/**
 * @param {function(Array)} callback
 * @param {Object} team
 */
gs.getTeamsMembers = function(callback, team) {
  gs.apiRequest('/teams/' + team.id + '/members', function(members) {
    callback(members);
  });
};


/**
 * @param {!yaa.CompleteHandler} complete
 * @param {!yaa.ErrorHandler} cancel
 */
gs.getProjects = function(complete, cancel) {
  gs.apiRequest('/orgs/LiveTex/repos', function(projects) {
    complete(projects);
  });
};


/**
 * @param {function(Object)} complete
 * @param {Object} project
 */
gs.getProjectCommits = function(complete, project) {
  gs.apiRequest('/repos/LiveTex/' + project.name + '/commits',
      function(commits) {
        complete(commits);
      });
};


/**
 * @type {number}
 */
gs.vazuzu = 0;


/**
 * @param {function(Array)} callback
 * @param {Object} team
 */
gs.getTeamsProjects = function(callback, team) {
  gs.apiRequest('/teams/' + team.id + '/repos',
      function(projects) {
        callback(projects);
      });
};


/**
 * @param {function(Object, Object)} callback
 * @param {Object} project
 */
gs.getProjectId = function(callback, project) {
  pg.exec('SELECT git.project.id, git.project.name  FROM git.project WHERE ' +
      'git.project.name = \'' + project.name + '\'', function(table) {
        if (table.length) {  // check it
          callback(table[0].id, project);
        }
      }, console.error);
};


/**
 * @param {function(Object)} callback
 * @param {Object} sha
 * @param {Object} projectName
 */
gs.getFileName = function(callback, sha, projectName) {
  gs.apiRequest('/repos/LiveTex/' + projectName + '/commits/' + sha,
      function(teams) {
        callback(teams);
      });
};


/**
 * @param {!yaa.CompleteHandler} complete
 * @param {!yaa.ErrorHandler} cancel
 */
gs.getDBProject = function(complete, cancel) {
  pg.exec('SELECT git.project.name as name, ' +
      'git.project.id as id ' +
      'FROM git.project',
      function(table) {
        complete(table);
      }, console.error);
};
