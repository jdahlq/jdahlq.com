
// Command line options
var cli = require('commander');

cli
  .version('0.0.1')
  .option('-p, --prod', 'run in production mode')
  .parse(process.argv)
;

if (cli['prod']) console.log("Running in production mode.");

// imports
var express = require('express')
  , expressCons = require('consolidate')
  , lessMiddleware = require('less-middleware');

// setup
var app = express();

// templating
app.engine('html', expressCons.hogan);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');

app.use(lessMiddleware({
  src: __dirname + '/style',
  dest: __dirname + '/public',
  prefix: '/public',
  compress: false
}));
app.use('/public', express.static('public'));
app.use(app.router);
app.use(function (err, req, res, next) {
  console.error(err);
  res.send(500, 'Something catastrophic happened. See: <a href="http://homestarrunner.com/sbemail45.html">homestarrunner.com/sbemail45.html</a>')
});
app.use(function (req, res, next) {
  res.send(404, '404 Not Found, man! See: <a href="http://mannotfounddog.ytmnd.com/">mannotfounddog.ytmnd.com</a>');
});


// routing
app.get('/', function (req, res) {
  res.render('index');
});

app.listen(1337);