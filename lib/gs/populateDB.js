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

