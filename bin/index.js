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
var gs = {};


/**
 * @param {string=} opt_since format: YYYY-MM-DD
 * @param {string=} opt_until format: YYYY-MM-DD
 */
gs.sendDate = function(opt_since, opt_until) {
  if (opt_since) {
    opt_since = '&&since=' + opt_since;
  } else {opt_since = ''}
  if (opt_until) {
    opt_until = '&&until=' + opt_until;
  } else {opt_until = ''}
  gs.date = opt_since + opt_until;
};


/**
 * @namespace
 */
gs.date = '';


/**
 * @param {string} Table
 */
gs.cleanTable = function(Table) {
  pg.exec('DELETE FROM ' + Table, function() {
    console.log(Table + ' table clean');
  }, console.error);
};


/**
 * @param {Object} team
 * @return {function(Object)}
 */
gs.membersHandler = function(team) {
  return function(members) {
    for (var j = 0; j < members.length; j++) {
      gs.saveTeamsMembers(team, members[j]);
    }
  }
};


/**
 * @param {Object} team
 * @return {function(Object)}
 */
gs.teamHandler = function(team) {
  return function(project) {
    for (var i = 0; i < project.length; i++) {
      gs.getProjectId(function(projectid, project) {
        gs.saveTeamsProjects(team, project, projectid);
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
      gs.saveFileName(sha, shaCommit[0].files[j].filename, id);
    }
  }
};


/**
 * @param {function()} callback
 * @param {Object} project
 * @return {function(Object)}
 */
gs.commitsHandler = function(callback, project) {
  return function(commits) {
    var commitsLength = commits.length;
    if (commitsLength) {
      for (var j = 0, i = 0; j < commitsLength; j++) {
        gs.saveProjectCommits(function() {
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
gs.populateDB = function() {

  yaa.sequence([

    gs.populateProject(),
    gs.team,
    gs.populateCommit,
    gs.populateFilesName

  ]).call(this, function() {
    console.log('well done');
  }, console.error);
};


/**
 * @param {!yaa.CompleteHandler} complete
 * @param {!yaa.ErrorHandler} cancel
 */
gs.team = function(complete, cancel) {
  gs.getTeamsList(function(teams) {
    for (var i = 0; i < teams.length; i++) {
      gs.saveTeamList(teams[i]);
      gs.getTeamsProjects(gs.teamHandler(teams[i]), teams[i]);
      gs.getTeamsMembers(gs.membersHandler(teams[i]), teams[i]);
    }
    complete();
  });
};


///**
// * @param {!yaa.CompleteHandler} complete
// * @param {!yaa.ErrorHandler} cancel
// */
//gs.populateProject = function(complete, cancel) {
//  gs.getProjects(function(projects) {
//    var projectLength = projects.length;
//    for (var i = 0, j = 0; i < projectLength; i++) {
//      gs.saveProjects(function() {
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
gs.populateProject = function() {
  return yaa.sequence([
    gs.getProjects,
    yaa.proc.parallel(
        gs.saveProjects,
        yaa.iterator.array()
    )
  ]);
};


/**
 * @param {function()} callback
 */
gs.populateCommit = function(callback) {
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
      gs.getProjectCommits(gs.commitsHandler(function() {
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
gs.populateFilesName = function() {

  function getCommit(callback) {
    pg.exec('SELECT  git.commits.sha as sha, ' +
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
      gs.getFileName(fileNameHandler(projectCommits[j].id,
          projectCommits[j].sha), projectCommits[j].sha,
              projectCommits[j].name);
    }
  });



};


/**
 * @param {string} path
 * @param {function(Array)} callback
 */
gs.apiRequest = function(path, callback) {
  var thisArray = [];
  var page = 1;
  function send(page) {
    gs.sendRequest(path + '?page=' + page, function(array) {
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
gs.sendRequest = function(path, callback) {
  var options = {
    host: 'api.github.com',
    method: 'GET',
    path: '' + path + '&&per_page=100' + gs.date,
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
gs.cleanAll = function() {
  gs.cleanTable('git.teamsmembers');
  gs.cleanTable('git.teams');
  gs.cleanTable('git.commits');
  gs.cleanTable('git.project');
  gs.cleanTable('git.teamsprojects');
  gs.cleanTable('git.filesname');
};


/**
 * @param {function(string)} callback
 */
gs.getLastDate = function(callback) {
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
gs.init = function() {
  gs.getLastDate(function(lastDate) {
    gs.sendDate(lastDate);
    gs.populateDB();
  });
  //gs.cleanTable('gs.filesname');
  //gs.cleanAll();
  //gs.cleanTable('gs.commits');
  //gs.cleanTable('gs.filesname');
};

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
/**
 * @param {Object} team
 */
gs.saveTeamList = function(team) {
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
gs.saveTeamsMembers = function(team, member) {
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
gs.saveProjects = function(complete, cancel, project) {
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
gs.saveProjectCommits = function(complete, commit, project) {
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
gs.saveTeamsProjects = function(team, project, projectId) {
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
gs.saveFileName = function(sha, filename, projectId) {
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

gs.init();
