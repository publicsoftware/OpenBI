var express	= require('express');
var router	= express.Router();
var mysql	= require('mysql');
var crypto	= require('crypto');

var db = mysql.createConnection({
	host		: 'localhost',
	user		: 'openbi',
	password	: 'p@ssword',
	database	: 'openbi'
});

var title = 'OpenBI';

router.get('/', function(req, res) {
	if (req.session.info == null) {
		res.redirect('/welcome');
	}
	else {
		res.render('index.html', { title: title });
	}
});

router.get('/data', function(req, res) {
	if (req.session.info == null) {
		res.redirect('/login');
	}
	else {
		res.render('data.html', { title: title });
	}
});

router.get('/data', function(req, res) {
	if (req.session.info == null) {
		res.redirect('/login');
	}
	else {
		db.query("select * from data where user=?",
			[req.session.info.id],
			function(err, rows) {
				res.send(rows);
			});
	}
});

/*
	{
	fieldname: 'file',
	originalname: 'data-visulization-Ecommerce-in-Real-Time-How-Money-is-Spent-on-the-Internet-interactive-infographic.png',
	name: '316f6e43da29ee166d8f5e73aa1abda2.png',
	encoding: '7bit',
	mimetype: 'image/png',
	path: 'uploads/316f6e43da29ee166d8f5e73aa1abda2.png',
	extension: 'png',
	size: 589779,
	truncated: false
	}
 */
router.post('/data-upload', function(req, res) {
	console.log(req.body);
	console.log(req.files);
	res.redirect("/data");
});

router.get('/data-list', function(req, res) {
	if (req.session.info == null) {
		res.send({result:'error'});
	}
	else {
		db.query("select * from data where user=?",
			[req.session.info.id],
			function(err, rows) {
				res.send(rows);
			});
	}
});

router.post('/data-add', function(req, res) {
	if (req.session.info == null) {
		res.send({result:'error'});
	}
	else {
		if (req.body.id === 0) {
			db.query("insert into data(user, name, data) values(?, ?, ?)",
				[req.session.info.id, req.body.name, req.body.data],
				function(err, rows) {
					res.send({result:'ok'});
				});
		}
		else {
			db.query("update data set name=?, data=? where id=? and user=?",
				[req.body.name, req.body.data, req.body.id, req.session.info.id]
				, function(err, rows) {
					res.send({result:'ok'});
				});
		}
	}
});

router.get('/demo', function(req, res) {
	res.render('demo.html', { title: title });
});

router.get('/demo1', function(req, res) {
	res.render('demo1.html', { title: title });
});

router.get('/demo2', function(req, res) {
	res.render('demo2.html', { title: title });
});

router.get('/demo3', function(req, res) {
	res.render('demo3.html', { title: title });
});

router.get('/demo4', function(req, res) {
	res.render('demo4.html', { title: title });
});

router.get('/demo5', function(req, res) {
	res.render('demo5.html', { title: title });
});

router.get('/demo6', function(req, res) {
	res.render('demo6.html', { title: title });
});

router.get('/demo7', function(req, res) {
	res.render('demo7.html', { title: title });
});

router.get('/demo8', function(req, res) {
	res.render('demo8.html', { title: title });
});

router.get('/demo9', function(req, res) {
	res.render('layout-1-2.html', { title: title });
});

router.get('/welcome', function(req, res) {
	res.render('welcome.html', { title: title });
});

router.get('/login', function(req, res) {
	if (req.session.info == null) {
		res.render('login.html', { title: title });
	}
	else {
		res.redirect("/");
	}
});

router.post('/login', function(req, res) {
	var digest = crypto.createHash('sha256').update(req.body.password)
					.digest("hex");
	db.query('select * from users where email=? or user=?',
		[req.body.username, req.body.username],
		function(err, rows) {
			if (rows[0].password === digest) {
				req.session.info = rows[0];
				res.send({result:'ok'});
			}
			else {
				res.send({result:'error'});
			}
		});
});

router.get('/logout', function(req, res) {
	req.session.destroy();
	res.render('logout.html', { title: title });
});

router.get('/debug', function(req, res) {
	/*
	db.query("select * from users",
		function(err, rows) {
			res.send(rows);
		});
	*/
});

module.exports = router;




















/*
NOTE:







*/
