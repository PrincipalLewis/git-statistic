/**
 * @namespace
 */
var gs = {};


/**
 * @param {string=} opt_since format: YYYY-MM-DD
 * @param {string=} opt_until format: YYYY-MM-DD
 */
gs.sendDate = function(opt_since, opt_until) {};


/**
 * @namespace
 */
gs.date


/**
 * @param {string} Table
 */
gs.cleanTable = function(Table) {};


/**
 * @param {Object} team
 * @return {function(Object)}
 */
gs.membersHandler = function(team) {};


/**
 * @param {Object} team
 * @return {function(Object)}
 */
gs.teamHandler = function(team) {};


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
gs.commitsHandler = function(callback, project) {};


/**
 * Заполнение базы
 * @this {Object}
 */
gs.populateDB = function() {};


/**
 * @param {!yaa.CompleteHandler} complete
 * @param {!yaa.ErrorHandler} cancel
 */
gs.team = function(complete, cancel) {};


/**
 * @return {!yaa.Step}
 */
gs.populateProject = function() {};


/**
 * @param {function()} callback
 */
gs.populateCommit = function(callback) {};


/**
 *
 */
gs.populateFilesName = function() {};


/**
 * @param {string} path
 * @param {function(Array)} callback
 */
gs.apiRequest = function(path, callback) {};


/**
 * @param {string} path
 * @param {function(!Object)} callback
 */
gs.sendRequest = function(path, callback) {};


/**
 *
 */
gs.cleanAll = function() {};


/**
 * @param {function(string)} callback
 */
gs.getLastDate = function(callback) {};


/**
 * точка входа
 */
gs.init = function() {};


/**
 * @param {function(Array)} callback
 */
gs.getTeamsList = function(callback) {};


/**
 * @param {function(Array)} callback
 * @param {Object} team
 */
gs.getTeamsMembers = function(callback, team) {};


/**
 * @param {!yaa.CompleteHandler} complete
 * @param {!yaa.ErrorHandler} cancel
 */
gs.getProjects = function(complete, cancel) {};


/**
 * @param {function(Object)} complete
 * @param {Object} project
 */
gs.getProjectCommits = function(complete, project) {};


/**
 * @type {number}
 */
gs.vazuzu;


/**
 * @param {function(Array)} callback
 * @param {Object} team
 */
gs.getTeamsProjects = function(callback, team) {};


/**
 * @param {function(Object, Object)} callback
 * @param {Object} project
 */
gs.getProjectId = function(callback, project) {};


/**
 * @param {function(Object)} callback
 * @param {Object} sha
 * @param {Object} projectName
 */
gs.getFileName = function(callback, sha, projectName) {};


/**
 * @param {!yaa.CompleteHandler} complete
 * @param {!yaa.ErrorHandler} cancel
 */
gs.getDBProject = function(complete, cancel) {};


/**
 * @param {Object} team
 */
gs.saveTeamList = function(team) {};


/**
 * @param {Object} team
 * @param {Object} member
 */
gs.saveTeamsMembers = function(team, member) {};


/**
 * @param {!yaa.CompleteHandler} complete
 * @param {!yaa.ErrorHandler} cancel
 * @param {Object} project
 */
gs.saveProjects = function(complete, cancel, project) {};


/**
 * @param {Object} team
 * @param {Object} project
 * @param {Object} projectId
 */
gs.saveTeamsProjects = function(team, project, projectId) {};


/**
 * @param {Object} sha
 * @param {Object} filename
 * @param {number} projectId
 */
gs.saveFileName = function(sha, filename, projectId) {};




