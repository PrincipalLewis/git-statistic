/**
 * @param {function(Array)} callback
 */
git.getTeamsList = function(callback) {
  git.apiRequest('/orgs/LiveTex/teams', function(teams) {
    callback(teams);
  });
};


/**
 * @param {function(Array)} callback
 * @param {Object} team
 */
git.getTeamsMembers = function(callback, team) {
  git.apiRequest('/teams/' + team.id + '/members', function(members) {
    callback(members);
  });
};


/**
 * @param {!yaa.CompleteHandler} complete
 * @param {!yaa.ErrorHandler} cancel
 */
git.getProjects = function(complete, cancel) {
  git.apiRequest('/orgs/LiveTex/repos', function(projects) {
    complete(projects);
  });
};


/**
 * @param {function(Object)} complete
 * @param {Object} project
 */
git.getProjectCommits = function(complete, project) {
  git.apiRequest('/repos/LiveTex/' + project.name + '/commits',
      function(commits) {
        complete(commits);
      });
};


/**
 * @type {number}
 */
git.vazuzu = 0;


/**
 * @param {function(Array)} callback
 * @param {Object} team
 */
git.getTeamsProjects = function(callback, team) {
  git.apiRequest('/teams/' + team.id + '/repos',
      function(projects) {
        callback(projects);
      });
};


/**
 * @param {function(Object, Object)} callback
 * @param {Object} project
 */
git.getProjectId = function(callback, project) {
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
git.getFileName = function(callback, sha, projectName) {
  git.apiRequest('/repos/LiveTex/' + projectName + '/commits/' + sha,
      function(teams) {
        callback(teams);
      });
};


/**
 * @param {!yaa.CompleteHandler} complete
 * @param {!yaa.ErrorHandler} cancel
 */
git.getDBProject = function(complete, cancel) {
  pg.exec('SELECT git.project.name as name, ' +
      'git.project.id as id ' +
      'FROM git.project',
      function(table) {
        complete(table);
      }, console.error);
};
