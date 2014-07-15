var PORT = 3500;

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var routes = require('./routes/index');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());

app.set('trust proxy', 1);
app.use(session({
	secret: 'priv@te' ,
	cookie: { maxAge: 60000 * 60 /*, secure: true */ },
	saveUninitialized: true,
	resave: true
}));

app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.engine('html', require('ejs').renderFile);
app.use('/', routes);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// production error handler, no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error.html', {
		message: err.message,
		error: {}
	});
});

var server = app.listen(PORT, function() {
	console.log('Express server listening on port ' + server.address().port);
});
