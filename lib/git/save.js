/**
 * @param {Object} team
 */
git.saveTeamList = function(team) {
  pg.exec('INSERT INTO git.teams (name, id) VALUES ' +
      '(\'' + team.name + '\', ' + team.id + ')', function() {
        console.log('team added');
      }, function(err) {
        if (err.indexOf('duplicate key value') !== 8) {
          console.log(err);
        }
      });
};


/**
 * @param {Object} team
 * @param {Object} member
 */
git.saveTeamsMembers = function(team, member) {
  pg.exec('INSERT INTO git.teamsmembers (login, idt) VALUES ' +
      '(\'' + member.login + "\', " + team.id + ')',
      function() {console.log('teamMember added')}, function(err) {
        if (err.indexOf('duplicate key value') !== 8) {
          console.log(err);
        }
      });
};


/**
 * @param {!yaa.CompleteHandler} complete
 * @param {!yaa.ErrorHandler} cancel
 * @param {Object} project
 */
git.saveProjects = function(complete, cancel, project) {
  pg.exec('INSERT INTO git.project (name, id) VALUES (\'' + project.name +
      '\',' + project.id + ')',
      function() {
        console.log('project added');
        complete();
      }, function(err) {
        if (err.indexOf('duplicate key value') !== 8) {
          console.log(err);
        }
        complete();
      });
};


/**
 * @param {!yaa.CompleteHandler} complete

 * @param {Object} commit
 * @param {Object} project
 */
git.saveProjectCommits = function(complete, commit, project) {
  if (commit && commit.committer && commit.commit) {
    pg.exec('INSERT INTO git.commits  (sha, login, date, projectid) ' +
        'VALUES (\'' + commit.sha + '\', \'' + commit.committer.login +
        '\', \'' + commit.commit.committer.date + '\',\'' + project.id + '\')',
        function() {
          console.log('commit added');
          complete();
        }, function(err) {
          if (err.indexOf('duplicate key value') !== 8) {
            console.log(err);
          }
          complete();
        });
  }
  else {
    complete();
  }
};


/**
 * @param {Object} team
 * @param {Object} project
 * @param {Object} projectId
 */
git.saveTeamsProjects = function(team, project, projectId) {
  pg.exec('INSERT INTO git.teamsprojects  (projectname, teamid, projectid) ' +
      'VALUES (\'' + project.name + '\',\'' + team.id + '\',\'' +
      projectId + '\')',
      function(table) {console.log('projectteam add' + table)}, function(err) {
        if (err.indexOf('duplicate key value') !== 8) {
          console.log(err);
        }
      });
};


/**
 * @param {Object} sha
 * @param {Object} filename
 * @param {number} projectId
 */
git.saveFileName = function(sha, filename, projectId) {
  pg.exec('INSERT INTO git.filesname (sha, filename, projectid) VALUES ' +
      '(\'' + sha + '\',\'' + filename + '\',\'' + projectId + '\')',
      function() {
        console.log('fileName added');
      }, function(err) {
        if (err.indexOf('duplicate key value') !== 8) {
          console.log(err);
        }
      });
};
