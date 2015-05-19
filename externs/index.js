/**
 * @namespace
 */
var git = {};


/**
 * @param {string=} opt_since format: YYYY-MM-DD
 * @param {string=} opt_until format: YYYY-MM-DD
 */
git.sendDate = function(opt_since, opt_until) {};


/**
 * @namespace
 */
git.date


/**
 * @param {string} Table
 */
git.cleanTable = function(Table) {};


/**
 * @param {Object} team
 * @return {function(Object)}
 */
git.membersHandler = function(team) {};


/**
 * @param {Object} team
 * @return {function(Object)}
 */
git.teamHandler = function(team) {};


/**
 * @param {number} id
 * @param {Object} sha
 * @return {function(Object)}
 */
var fileNameHandler = function(id, sha) {};


/**
 * @param {function()} callback
 * @param {Object} project
 * @return {function(Object)}
 */
git.commitsHandler = function(callback, project) {};


/**
 * Заполнение базы
 * @this {Object}
 */
git.populateDB = function() {};


/**
 * @param {!yaa.CompleteHandler} complete
 * @param {!yaa.ErrorHandler} cancel
 */
git.team = function(complete, cancel) {};


/**
 * @return {!yaa.Step}
 */
git.populateProject = function() {};


/**
 * @param {function()} callback
 */
git.populateCommit = function(callback) {};


/**
 *
 */
git.populateFilesName = function() {};


/**
 * @param {string} path
 * @param {function(Array)} callback
 */
git.apiRequest = function(path, callback) {};


/**
 * @param {string} path
 * @param {function(!Object)} callback
 */
git.sendRequest = function(path, callback) {};


/**
 *
 */
git.cleanAll = function() {};


/**
 * @param {function(string)} callback
 */
git.getLastDate = function(callback) {};


/**
 * точка входа
 */
git.init = function() {};


/**
 * @param {function(Array)} callback
 */
git.getTeamsList = function(callback) {};


/**
 * @param {function(Array)} callback
 * @param {Object} team
 */
git.getTeamsMembers = function(callback, team) {};


/**
 * @param {!yaa.CompleteHandler} complete
 * @param {!yaa.ErrorHandler} cancel
 */
git.getProjects = function(complete, cancel) {};


/**
 * @param {function(Object)} complete
 * @param {Object} project
 */
git.getProjectCommits = function(complete, project) {};


/**
 * @type {number}
 */
git.vazuzu;


/**
 * @param {function(Array)} callback
 * @param {Object} team
 */
git.getTeamsProjects = function(callback, team) {};


/**
 * @param {function(Object, Object)} callback
 * @param {Object} project
 */
git.getProjectId = function(callback, project) {};


/**
 * @param {function(Object)} callback
 * @param {Object} sha
 * @param {Object} projectName
 */
git.getFileName = function(callback, sha, projectName) {};


/**
 * @param {!yaa.CompleteHandler} complete
 * @param {!yaa.ErrorHandler} cancel
 */
git.getDBProject = function(complete, cancel) {};


/**
 * @param {Object} team
 */
git.saveTeamList = function(team) {};


/**
 * @param {Object} team
 * @param {Object} member
 */
git.saveTeamsMembers = function(team, member) {};


/**
 * @param {!yaa.CompleteHandler} complete
 * @param {!yaa.ErrorHandler} cancel
 * @param {Object} project
 */
git.saveProjects = function(complete, cancel, project) {};


/**
 * @param {Object} team
 * @param {Object} project
 * @param {Object} projectId
 */
git.saveTeamsProjects = function(team, project, projectId) {};


/**
 * @param {Object} sha
 * @param {Object} filename
 * @param {number} projectId
 */
git.saveFileName = function(sha, filename, projectId) {};




