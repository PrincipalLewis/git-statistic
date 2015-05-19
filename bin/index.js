var pg = require('node-pg');
var yaa = require('node-yaa');
var https = require('https');

pg.init(20, {
  'user': 'postgres',
  'dbname': 'postgres',
  'hostaddr': '127.0.0.1',
  'port': '5432'
});


/**
 * @namespace
 */
var git = {};


/**
 * @param {string=} opt_since format: YYYY-MM-DD
 * @param {string=} opt_until format: YYYY-MM-DD
 */
git.sendDate = function(opt_since, opt_until) {
  if (opt_since) {
    opt_since = '&&since=' + opt_since;
  } else {opt_since = ''}
  if (opt_until) {
    opt_until = '&&until=' + opt_until;
  } else {opt_until = ''}
  git.date = opt_since + opt_until;
};


/**
 * @namespace
 */
git.date = '';


/**
 * @param {string} Table
 */
git.cleanTable = function(Table) {
  pg.exec('DELETE FROM ' + Table, function() {
    console.log(Table + ' table clean');
  }, console.error);
};


/**
 * @param {Object} team
 * @return {function(Object)}
 */
git.membersHandler = function(team) {
  return function(members) {
    for (var j = 0; j < members.length; j++) {
      git.saveTeamsMembers(team, members[j]);
    }
  }
};


/**
 * @param {Object} team
 * @return {function(Object)}
 */
git.teamHandler = function(team) {
  return function(project) {
    for (var i = 0; i < project.length; i++) {
      git.getProjectId(function(projectid, project) {
        git.saveTeamsProjects(team, project, projectid);
      },project[i]);
    }
  }
};


/**
 * @param {number} id
 * @param {Object} sha
 * @return {function(Object)}
 */
var fileNameHandler = function(id, sha) {
  return function(shaCommit) {
    for (var j = 0; j < shaCommit[0].files.length; j++) {
      git.saveFileName(sha, shaCommit[0].files[j].filename, id);
    }
  }
};


/**
 * @param {function()} callback
 * @param {Object} project
 * @return {function(Object)}
 */
git.commitsHandler = function(callback, project) {
  return function(commits) {
    var commitsLength = commits.length;
    if (commitsLength) {
      for (var j = 0, i = 0; j < commitsLength; j++) {
        git.saveProjectCommits(function() {
          if (++i === commitsLength) {
            callback();
          }
        }, commits[j], project);
      }
    } else {callback()}
  }
};


/**
 * Заполнение базы
 * @this {Object}
 */
git.populateDB = function() {

  yaa.sequence([

    git.populateProject(),
    git.team,
    git.populateCommit,
    git.populateFilesName

  ]).call(this, function() {
    console.log('well done');
  }, console.error);
};


/**
 * @param {!yaa.CompleteHandler} complete
 * @param {!yaa.ErrorHandler} cancel
 */
git.team = function(complete, cancel) {
  git.getTeamsList(function(teams) {
    for (var i = 0; i < teams.length; i++) {
      git.saveTeamList(teams[i]);
      git.getTeamsProjects(git.teamHandler(teams[i]), teams[i]);
      git.getTeamsMembers(git.membersHandler(teams[i]), teams[i]);
    }
    complete();
  });
};


///**
// * @param {!yaa.CompleteHandler} complete
// * @param {!yaa.ErrorHandler} cancel
// */
//git.populateProject = function(complete, cancel) {
//  git.getProjects(function(projects) {
//    var projectLength = projects.length;
//    for (var i = 0, j = 0; i < projectLength; i++) {
//      git.saveProjects(function() {
//        if (++j === projectLength) {
//          complete();
//        }
//      }, projects[i]);
//    }
//  });
//};


/**
 * @return {!yaa.Step}
 */
git.populateProject = function() {
  return yaa.sequence([
    git.getProjects,
    yaa.proc.parallel(
        git.saveProjects,
        yaa.iterator.array()
    )
  ]);
};


/**
 * @param {function()} callback
 */
git.populateCommit = function(callback) {
  function getProject(callback) {
    pg.exec('SELECT git.project.name as name, ' +
        'git.project.id as id ' +
        'FROM git.project',
        function(table) {
          callback(table);
        }, console.error);
  }

  getProject(function(project) {
    var projectLength = project.length;
    console.log(projectLength);
    for (var i = 0, j = 0; i < projectLength; i++) {
      git.getProjectCommits(git.commitsHandler(function() {
        if (++j === projectLength) {
          callback();
        }
      }, project[i]), project[i]);
    }
  });

};


/**
 *
 */
git.populateFilesName = function() {

  function getCommit(callback) {
    pg.exec(' SELECT  git.commits.sha as sha, ' +
        'git.project.name as name, ' +
        'git.project.id as id ' +
        'FROM git.commits ' +
        'LEFT JOIN git.project ON git.commits.projectid = git.project.id ' +
        'LEFT JOIN git.filesname USING(sha) ' +
        'WHERE filename IS NULL',
        function(table) {
          callback(table);
        }, console.error);
  }

  getCommit(function(projectCommits) {
    for (var j = 0; j < projectCommits.length; j++) {
      git.getFileName(fileNameHandler(projectCommits[j].id,
          projectCommits[j].sha), projectCommits[j].sha,
              projectCommits[j].name);
    }
  });



};


/**
 * @param {string} path
 * @param {function(Array)} callback
 */
git.apiRequest = function(path, callback) {
  var thisArray = [];
  var page = 1;
  function send(page) {
    git.sendRequest(path + '?page=' + page, function(array) {
      if (array.length === 100) {
        thisArray = thisArray.concat(array);
        send(++page);
      }
      else {
        thisArray = thisArray.concat(array);
        callback(thisArray);
      }
    });
  }
  send(page);
};


/**
 * @param {string} path
 * @param {function(!Object)} callback
 */
git.sendRequest = function(path, callback) {
  var options = {
    host: 'api.github.com',
    method: 'GET',
    path: '' + path + '&&per_page=100' + git.date,
    headers:
        {'User-Agent': 'https://api.github.com/meta'},
    auth: 'PrincipalLewis:bezdyk666'
  };
  var request = https.request(options, function(response) {
    var body = '';
    response.on('data', function(chunk) {
      body += chunk;
    });
    response.on('end', function() {
      //console.log(path);
      var json = JSON.parse(body);
      //console.log(json);
      callback(json);
    });
  });
  request.on('error', function(e) {
    console.error('and the error is ' + e);
  });
  request.end();
};


/**
 *
 */
git.cleanAll = function() {
  git.cleanTable('git.teamsmembers');
  git.cleanTable('git.teams');
  git.cleanTable('git.commits');
  git.cleanTable('git.project');
  git.cleanTable('git.teamsprojects');
  git.cleanTable('git.filesname');
};


/**
 * @param {function(string)} callback
 */
git.getLastDate = function(callback) {
  pg.exec('SELECT git.commits.date AS date ' +
      'FROM git.commits ' +
      'ORDER BY date DESC ',
      function(table) {
        callback(table[0].date);
      }, console.error);
};


/**
 * точка входа
 */
git.init = function() {
  git.getLastDate(function(lastDate) {
    git.sendDate(lastDate);
    git.populateDB();
  });
  //git.cleanTable('git.filesname');
  //git.cleanAll();
  //git.cleanTable('git.commits');
  //git.cleanTable('git.filesname');
};

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

git.init();
