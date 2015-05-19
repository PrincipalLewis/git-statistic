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

