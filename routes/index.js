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

db.on('error', function(err) {
	console.log(err.code);
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

router.get('/dashboard', function(req, res) {
	res.redirect('/');
});

router.get('/dashboard/:id', function(req, res) {
	var user = req.session.info ? req.session.info.id : 0;
	db.query("select * from dashboards where id=? and (user=? or public=1)",
	[req.params.id, user],
	function (error, rows) {
		if (error || rows.length === 0) {
			res.redirect("/");
		}
		else {
			rows[0].data = '/' + rows[0].data;
			db.query("select * from charts where dashboard=?",
				[req.params.id],
			function(error, charts) {
				if (error) {
					res.redirect("/");
				}
				else {
					res.render('absolute.html', { 
						title: title + ' ' + rows[0].name,
						dashboard: rows[0],
						charts: charts
					});
				}
			});
		}
	});
});

router.post('/dashboard-save', function(req, res) {
	var user      = req.session.info.id;
	var dashboard = parseInt(req.body.dashboard);
	var public    = parseInt(req.body.public);
	db.query("select user from dashboards where id=?",[dashboard], 
	function(error, records) {
		if (error || records.length === 0) {
			res.send({result:'error', info:'dashboard not found'});
		}
		else {
			if (records[0].user === user) {
				db.query("update dashboards set public=? where id=?",
				[public, dashboard],
				function(errors, records) {
					if (errors) {			
						res.send({result:'error', info:'database error'});
					}
					else {
						res.send({result:'ok'});
					}
				});
			}
			else {
				res.send({result:'error', info:'permission denied'});
			}
		}
	});
});

router.post('/chart-save', function(req, res) {
	var id = parseInt(req.body.id);
	var dashboard = parseInt(req.body.dashboard);
	
	if (req.session.info == null) {
		res.send({result:'error'});
	}
	else {
		db.query("select user from dashboards where id=?", [dashboard],
		function(error, records) {
			if (error) {
				res.send({result:'error'});
			}
			else
			{
				if (records[0].user === req.session.info.id) {
					if (id === 0) {
						db.query("insert into charts(dashboard, name, " + 
								" x, y, width, height) " +
								" values(?, ?, ?, ?, ?, ?)",
						[dashboard, req.body.name,
							req.body.x, req.body.y, 
							req.body.width, req.body.height],
						function(error, rows) {
							res.send({result:'ok'});
						});
					}
					else {
						db.query("update charts set " +
								" name=?," +
								" x=?, y=?, width=?, height=? " +
								" where id = ?"
						,[req.body.name,
							req.body.x, req.body.y, 
							req.body.width, req.body.height,
							id],
						function(error, rows) {
							res.send({result:'ok'});
						});
					}
				}
				else {
					res.send({result:'error'});
				}
			}
		});
	}
			
});

router.get('/data', function(req, res) {
	res.send([]);
});

router.get('/data/:id', function(req, res) {
	var user = req.session.info ? req.session.info.id : 0;
	db.query("select * from dashboards where id=? and (user=? or public=1)",
	[req.params.id, user],
	function (error, rows) {
		if (error) {
			res.send([]);
		}
		else {
			res.sendfile(rows[0].data);
		}
	});
});

router.post('/dashboard-create', function(req, res) {
	// console.log(req.files);
	if (req.session.info == null) {
		res.redirect("/login");
	}
	else {
		var path = req.files.file ? req.files.file.path : '';
		var name = req.files.file ? req.files.file.originalname : '';
		db.query("insert into dashboards(user, name, layout, " + 
				  " data_type, data_name, data) "
				+ " values(?, ?, ?, 'file', ?, ?)",
			[req.session.info.id, req.body.name, req.body.layout,
				name, path],
			function(error, rows) {
				res.redirect("/");
			});
	}
	
});

router.get('/dashboard-list', function(req, res) {
	if (req.session.info == null) {
		res.send([]);
	}
	else {
		db.query("select * from dashboards where user=?",
		[req.session.info.id],
		function(error, rows) {
			if (error) {
				res.send([]);
			}
			else {
				res.send(rows);
			}
		});
	}
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
		function(error, rows) {
			if (error == null && 
				rows.length > 0 && 
				rows[0].password === digest) 
			{
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

/*
req.files = 
{ file: 
   { fieldname: 'file',
     originalname: 'ndx.csv',
     name: 'ba7c2f5b698c5f1d0b0a37afddc78c1c.csv',
     encoding: '7bit',
     mimetype: 'text/csv',
     path: 'uploads/ba7c2f5b698c5f1d0b0a37afddc78c1c.csv',
     extension: 'csv',
     size: 347229,
     truncated: false } }
*/
