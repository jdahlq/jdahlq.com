/**
 * (c) 2012 Joe Dahlquist
 *
 * This project was designed to run on Node v0.8.x. Previous versions of Node will probably work
 * but have not been tested.
 *
 * To see a list of command line options, use the -h flag: node server -h
 */

// run in strict mode
"use strict";

//check platform and version
if (typeof process === 'undefined') throw new Error('You must run server.js with Node.js.');
var v = 'v0.8.';
if (process.version.substr(0, v.length) !== v)
  console.error('Warning: Running with Node', process.version+'.', v+'x', 'is recommended.');

// ----------------------------------
// CONFIG VARS
// ----------------------------------
var config = require('./config.json');

// ----------------------------------
// PROCESS COMMAND LINE ARGS
// ----------------------------------
var cli = require('commander')
  , pkg = require('./package.json');

cli
  .version(pkg.version)
  .option('-d --dev', 'Run in dev mode')
  .option('-p --port <port>', 'HTTP server port (default: 80)', parseInt)
  .option('-t --tests', 'Run all tests')
  .parse(process.argv);

if (cli['dev']) {
  config.httpPort = 1337;
}
if (cli['port']) config.httpPort = cli['port'];
if (cli['tests']) config.runTests = true;


// ----------------------------------
// SET UP HTTP SERVER & MIDDLEWARE
// ----------------------------------

// import 3rd party modules
var express = require('express')
  , expressCons = require('consolidate')
  , lessMiddleware = require('less-middleware');

// import apps

// create the http server
var expressHttp = express(); // create an http server


// Middleware

expressHttp.engine('html', expressCons.hogan); //templating engine
expressHttp.set('views', __dirname + '/views'); //template directory
expressHttp.set('view engine', 'html');  //template extension

expressHttp.use(lessMiddleware({  //LESS CSS
  src: __dirname + '/style',
  dest: __dirname + '/public',
  prefix: '/public',
  compress: false
}));

expressHttp.use('/public', express.static('public')); // static files directory



// ----------------------------------
// APPS & ROUTES
// ----------------------------------
var fs = require('fs')
  , QuanApp = require('quan/core/App.js');

// Apps are usually in the node_modules folder and defined in config.json.
//  However, they can also be placed in /apps and defined in /apps/config.json
//  If /apps/config.json exists, append this to the global config.apps:
try {
  var otherAppDefs = require('./apps/config.json');
  otherAppDefs.forEach(function (appDef) {
    config.apps.push(appDef);
  });
  if (!otherAppDefs || otherAppDefs.length === 0)
    console.info('Note: No apps were defined in /apps/config.json');
} catch (e) {
  console.info('Note: /apps/config.json does not exist, so no apps were loaded from /apps');
}

/**
 * Array of all mounted apps.
 * @type {Array.QuanApp}
 */
var apps = [];

var services = {
  expressHttp: expressHttp
};

// import app modules
config.apps.forEach(function (appDef) {
  var app = null;
  try {
    var AppClass = require(appDef.name);
    app = new AppClass();
  } catch(e) {
    if (e.code === 'MODULE_NOT_FOUND') console.error('Could not find app module', appDef.name);
    else console.error(e);
  }
  if (app) mountApp(app, appDef.mountTo);
});


/**
 * @param {QuanApp} app
 * @param {string} mountDir
 */
function mountApp(app, mountDir) {
  app.mount(services, mountDir);
  apps.push(app);
  console.log("Mounted app", app.getName(), "at", mountDir);
}

// More Middleware

expressHttp.use(expressHttp.router); // match routes (defined further down)

//Server error:
expressHttp.use(function (err, req, res, next) {
  console.error(err);
  res.send(500, 'Something catastrophic happened. See: <a href="http://homestarrunner.com/sbemail45.html">homestarrunner.com/sbemail45.html</a>')
});
//404 Not Found:
expressHttp.use(function (req, res, next) {
  res.send(404, '404 Not Found, man! See: <a href="http://mannotfounddog.ytmnd.com/">mannotfounddog.ytmnd.com</a>');
});


/*
expressHttp.get('/', function (req, res) {
  res.render('index');
});
*/

// listen on specified port
expressHttp.listen(config.httpPort);
console.log('HTTP server listening on port', config.httpPort);

// run tests if necessary
if (config.runTests) {
  console.log('Running tests for all apps...\n');
  apps.forEach(function (app) {
    app.runTests();
  });
}