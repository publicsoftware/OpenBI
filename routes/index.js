var express	= require('express');
var router	= express.Router();
var mysql	= require('mysql');
var crypto	= require('crypto');
var http    = require('http');

var title = 'OpenBI';
var OK    = { result: 'ok' };
var ERROR = { result: 'error' };

var pool = mysql.createPool({
	host		: 'localhost',
	user		: 'openbi',
	password	: 'p@ssword',
	database	: 'openbi'
});

pool.on('error', function(err) {
	console.log(err.code);
});

router.get('/', function(req, res) {
	res.render('index.html', {
		title: title
	});
});

router.get('/session', function(req, res) {
	// TODO: remove password
	res.send(req.session.info);
});

router.get('/document-list', function(req, res) {
	if (req.session.info == null) {
		res.send(ERROR);
	}
	else {
		pool.getConnection(function(error, db) {
			if (error) {
				res.send(ERROR);
			}
			else {
				db.query("select * from documents where user=?",
				[req.session.info.id],
				function(error, records) {
					var result = OK;
					result.data = records;
					res.send(result);
					db.release();
				});
			}
		});
	}
});


router.get('/logout', function(req, res) {
	req.session.destroy();
	res.send(OK);
});

router.get('/debug', function(req, res) {
	res.send(OK);
});

router.get('/document', function(req, res) {
	res.redirect('/');
});

router.get('/document/:id', function(req, res) {
	pool.getConnection(function(error, connection) {
		if (error) {
			res.redirect("/");
		}
		else {
			var user = req.session.info ? req.session.info.id : 0;
			connection.query(
			"select * from documents where id=? and (user=? or public=1)",
				[req.params.id, user],
			function (error, records) {
				if (error || records.length === 0) {
					res.redirect("/");
				}
				else {
					records[0].data = '/' + records[0].data;
					connection.query("select * from objects where document=?",
						[req.params.id],
					function(error, objects) {
						if (error) {
							res.redirect("/");
						}
						else {
							if (records[0].init == null) {
								records[0].init = '';
							}
							res.render('absolute.html', {
								title: title + ' ' + records[0].name,
								user: user,
								document: records[0],
								charts: objects
							});
						}
						connection.release();
					});
				}
			});
		}
	});
});

router.post('/document-save', function(req, res) {
	if (req.session.info == null) {
		res.redirect('/document/' + req.body.document);
	}
	else {
		var user     = req.session.info.id;
		var document = parseInt(req.body.document);
		var public   = req.body.public === 'on' ? 1 : 0;
		var init     = req.body.init;
		// init         = init.replace(/\r/g, '');

		pool.getConnection(function(error, connection) {
			if (error) {
				res.redirect('/document/' + req.body.document);
			}
			else {
				connection.query("select user from documents where id=?",
				[document],
				function(error, records) {
					if (error || records.length === 0) {
						res.redirect('/document/' + req.body.document);
					}
					else {
						if (records[0].user === user) {
							connection.query(
								"update documents set name=?, public=?, " +
								"init=? " +
								"where id=?",
							[req.body.name, public, init, document],
							function(error, r) {
								var path = req.files.file ?
										   req.files.file.path : '';
								var name = req.files.file ?
										   req.files.file.originalname : '';
								if (path === '') {
									connection.release();
									res.redirect('/document/' +
										req.body.document);
								}
								else {
									connection.query(
										"update documents set data_type='file'"+
										", data_name=?, data=? " +
										"where id=?",
									[name, path, document],
									function(error, r) {
										connection.release();
										res.redirect('/document/' +
											req.body.document);
									});
								}
							});
						}
						else {
							// TODO: REMOVE THE FILE 'path'
							res.redirect('/document/' + req.body.document);
						}
					}
				});
			}
		});
	}
});

router.post('/object-delete', function(req, res) {
	if (req.session.info == null) {
		res.send(ERROR);
	}
	else {
		pool.getConnection(function(error, connection) {
			if (error) {
				res.send(ERROR);
			}
			else {
				var id = parseInt(req.body.id);
				var document = parseInt(req.body.document);
				connection.query("select user from documents where id=?",
				[document],
				function(error, records) {
					if (error) {
						res.send(ERROR);
					}
					else
					{
						if (records[0].user === req.session.info.id) {
							connection.query("delete from objects where id=?",
							[id],
							function(errors, records) {
								if (errors) {
									res.send(ERROR);
								}
								else {
									res.send(OK);
								}
								connection.release();
							});
						}
						else {
							res.send(ERROR);
						}
					}
				});
			}
		});
	}
});

router.post('/object-save', function(req, res) {
	var id = parseInt(req.body.id);
	var document = parseInt(req.body.document);

	if (req.session.info == null) {
		res.send(ERROR);
	}
	else {
		pool.getConnection(function(error, connection) {
			if (error) {
				res.send(ERROR);
			}
			else {
				connection.query("select user from documents where id=?",
				[document],
				function(error, records) {
					if (error) {
						res.send(ERROR);
					}
					else
					{
						var type      = req.body.type;
						var dimension = req.body.dimension;
						var group     = req.body.group;

						if (records[0].user === req.session.info.id) {
							if (id === 0) {
								connection.query(
										"insert into objects(document, name, " +
										" type, dimension, reduce, sort, " +
										" top, top_value, " +
										" x, y, width, height) " +
									" values(?,?,?,?,?,?,?,?,?,?,?,?)",
								[document,
									req.body.name, type,
									dimension, group,
									req.body.sort,
									req.body.top, req.body.top_value,
									req.body.x, req.body.y,
									req.body.width, req.body.height],
								function(error, rows) {
									if (error) {
										res.send(ERROR);
									}
									else {
										res.send(OK);
									}
								});
							}
							else {
								connection.query("update objects set " +
									" name=?, type=?, dimension=?, reduce=?," +
									" sort=?, top=?, top_value=?," +
									" x=?, y=?, width=?, height=? " +
									" where id = ?"
								,[req.body.name, type,
									dimension, group,
									req.body.sort,
									req.body.top, req.body.top_value,
									req.body.x, req.body.y,
									req.body.width, req.body.height,
									id],
								function(error, rows) {
									if (error) {
										res.send(ERROR);
									}
									else {
										res.send(OK);
									}
									connection.release();
								});
							}
						}
						else {
							res.send(ERROR);
						}
					}
				});
			}
		});
	}

});

router.get('/data', function(req, res) {
	res.send([]);
});

router.get('/data/:id', function(req, res) {
	pool.getConnection(function(error, connection) {
		if (error) {
			res.send([]);
		}
		else {
			var user = req.session.info ? req.session.info.id : 0;
			connection.query(
			"select * from documents where id=? and (user=? or public=1)",
			[req.params.id, user],
			function (error, records) {
				if (error || records.length === 0) {
					res.send([]);
				}
				else {
					if (records[0].data == null) {
						res.send('');
					}
					else {
						res.sendfile(records[0].data);
					}
				}
				connection.release();
			});
		}
	});
});

router.post('/document-create', function(req, res) {
	if (req.session.info == null) {
		res.redirect("/login");
	}
	else {
		pool.getConnection(function(error, connection) {
			if (error) {
				res.redirect("/");
			}
			else {
				var name = req.body.name;
				if (name == null) {
					name = '';
				}
				var path = req.files.file ? req.files.file.path : '';
				var name = req.files.file ? req.files.file.originalname : '';
				if (path === '') {
					connection.query("insert into documents(user, name, theme)"+
						" values(?, ?, ?)",
						[req.session.info.id, name, req.body.theme],
					function(error, result) {
						if (result == null) {
							res.redirect("/");
						}
						else {
							res.redirect("/document/" + result.insertId);
						}
						connection.release();
					});
				}
				else {
					connection.query("insert into documents(user, name, theme,"+
						" data_type, data_name, data) " +
						" values(?, ?, ?, 'file', ?, ?)",
						[req.session.info.id, name, req.body.theme,
						name, path],
					function(error, result) {
						if (result == null) {
							res.redirect("/");
						}
						else {
							res.redirect("/document/" + result.insertId);
						}
						connection.release();
					});
				}
			}
		});
	}
});

router.post('/login', function(req, res) {
	pool.getConnection(function(error, connection) {
		if (error) {
			res.send(ERROR);
		}
		else {
			var digest = crypto.createHash('sha256').update(req.body.password)
					.digest("hex");
			connection.query('select * from users where email=? or user=?',
			[req.body.username, req.body.username],
			function(error, rows) {
				if (error == null &&
					rows.length > 0 &&
					rows[0].password === digest)
				{
					req.session.info = rows[0];
					res.send(OK);
				}
				else {
					res.send(ERROR);
				}
				connection.release();
			});
		}
	});

});

router.get('/debug-stock', function(req, res) {
	res.render('debug-stock.html', { title: title });
});


module.exports = router;







/*
NOTE:






*/

/*
// Using Connection Pool
var mysql =  require('mysql');
var pool =  mysql.createPool({
	host : 'host',
	user : 'username',
	password: 'password'
});

pool.getConnection(function(error, connection) {
	if (error) {

	}
	else {
		connection.query('select * from users',  function(error, records) {
			if (error) {
				// throw err;
			}
			else {
				// console.log(records);
			}
		});
	}

	connection.release();
});

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
