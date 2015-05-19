

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
 * @return {Function}
 */
var fileNameHandler = function(id, sha) {
  return function(shaCommit) {
    for (var j = 0; j < shaCommit[0].files.length; j++) {
      git.saveFileName(sha, shaCommit[0].files[j].filename, id);
    }
  }
};


/**
 * Заполнение базы
 */
git.populateDB = function() {
  yaa.sequence([
    git.populateProject(),
    git.team,
    bla,
    git.populateCommit(),

    git.populateFilesName

  ]).call(this, function() {
    console.log('well done');
  }, console.error);

  function bla(complete, cancel) {
    console.log('fuck');
    complete();
  }

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


/*
 git.populateCommit = function(callback) {
 git.getDBProject(function(project) {
 var projectLength = project.length;
 console.log(projectLength);
 for (var i = 0, j = 0; i < projectLength; i++) {
 git.getProjectCommits(git.commitsHandler(function() {
 if (++j === projectLength) {
 callback();
 }
 }, project[i]), project[i]);
 }
 }, function() {});
 };*/


/**
 * @return {!yaa.Step}
 */
git.populateCommit = function() {
  return yaa.sequence([
    git.getDBProject,
    yaa.proc.parallel(
        yaa.sequence([
          git.getProjectCommits,
          yaa.proc.parallel(
              git.saveProjectCommits,
              git.iterator()
          )
        ]),
        yaa.iterator.array()
    )
  ]);
};


/**
 * @return {!yaa.Step}
 */
git.iterator = function() {
  var i = -1;
  /**
   * @param {!yaa.CompleteHandler} complete
   * @param {!yaa.ErrorHandler} cancel
   * @param {!Array} commits
   * @param {!Object} project
   */
  function iterator(complete, cancel, commits, project) {
    var commit = commits[i += 1];
    var proj;
    if (commit) {
      proj = project;
    } else {
      proj = undefined;
      i = -1;
    }
    complete(commit, proj);
  }

  return yaa.esc(iterator);
};

/*
 git.commitsHandler = function(callback, project) {
 return function(commits) {
 var commitsLength = commits.length;
 for (var j = 0, i = 0; j < commitsLength; j++) {
 git.saveProjectCommits(function() {
 if (++i === commitsLength) {
 callback();
 }
 }, project, commits[j]);
 //git.getFileName(fileNameHandler(project.id, commits[j].sha),
 //    commits[j].sha, project.name);
 }
 }
 };*/


/**
 * @param {!yaa.CompleteHandler} complete
 * @param {!yaa.ErrorHandler} cancel
 */
git.populateFilesName = function(complete, cancel) {
  console.log('bla');
  function getCommit(callback) {
    console.log('bla');
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
  complete();
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
  options = {
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

//git.cleanAll();
//git.cleanTable('git.teamsprojects');


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
  //git.getLastDate(function(lastDate) {
  git.sendDate('2015-05-10');
  git.populateDB();
  //});
  //git.cleanTable('git.filesname');
  //git.cleanAll();
  //git.cleanTable('git.commits');
  //git.cleanTable('git.filesname');
};




save



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
 * @param {!yaa.ErrorHandler} cancel
 * @param {Object} commit
 * @param {object} project
 */
git.saveProjectCommits = function(complete, cancel, commit, project) {
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
 * @param {Object} projectid
 */
git.saveFileName = function(sha, filename, projectid) {
  pg.exec('INSERT INTO git.filesname (sha, filename, projectid) VALUES ' +
    '(\'' + sha + '\',\'' + filename + '\',\'' + projectid + '\')',
    function() {
      console.log('fileName added');
    }, function(err) {
      if (err.indexOf('duplicate key value') !== 8) {
        console.log(err);
      }
    });
};

