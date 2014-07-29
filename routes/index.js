var express	= require('express');
var router	= express.Router();
var mysql	= require('mysql');
var crypto	= require('crypto');
var http    = require('http');

var pool = mysql.createPool({
	host		: 'localhost',
	user		: 'openbi',
	password	: 'p@ssword',
	database	: 'openbi'
});

pool.on('error', function(err) {
	console.log(err.code);
});

var title = 'OpenBI';
/*
pool.getConnection(function(error, connection) {
	if (error) {
	}
	else {
		connection.query('select * from users',  function(error, records) {
			if (error) {
			}
			else {
			}
			connection.release();
		});
	}
});
*/

router.get('/', function(req, res) {
	if (req.session.info == null) {
		res.redirect('/welcome');
	}
	else {
		pool.getConnection(function(error, connection) {
			if (error) {
				res.redirect('/welcome');
			}
			else {
				connection.query('select * from documents where user=?',
					[req.session.info.id],
				function(error, records) {
					if (error) {
						res.redirect('/welcome');
					}
					else {
						res.render('index.html', {
							title: title,
							documents: records
						});
					}
					connection.release();
				});
			}
		});
	}
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
		var user      = req.session.info.id;
		var document  = parseInt(req.body.document);
		var public    = req.body.public === 'on' ? 1 : 0;
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
							var path = req.files.file ?
										req.files.file.path : '';
							var name = req.files.file ?
										req.files.file.originalname : '';
							connection.query(
								"update documents set name=?, public=?, " +
								"data_type='file', data_name=?, data=? " +
								"where id=?",
							[req.body.name, public, name, path, document],
							function(error, records) {
								if (error) {
								}
								else {
								}
								connection.release();
								res.redirect('/document/' + req.body.document);
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
		res.send({result:'error'});
	}
	else {
		pool.getConnection(function(error, connection) {
			if (error) {
				res.send({result:'error'});
			}
			else {
				var id = parseInt(req.body.id);
				var document = parseInt(req.body.document);
				connection.query("select user from documents where id=?",
				[document],
				function(error, records) {
					if (error) {
						res.send({result:'error'});
					}
					else
					{
						if (records[0].user === req.session.info.id) {
							connection.query("delete from objects where id=?",
							[id],
							function(errors, records) {
								if (errors) {
									res.send({result:'error'});
								}
								else {
									res.send({result:'ok'});
								}
								connection.release();
							});
						}
						else {
							res.send({result:'error'});
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
		res.send({result:'error'});
	}
	else {
		pool.getConnection(function(error, connection) {
			if (error) {
				res.send({result:'error'});
			}
			else {
				connection.query("select user from documents where id=?",
				[document],
				function(error, records) {
					if (error) {
						res.send({result:'error'});
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
										res.send({result:'error'});
									}
									else {
										res.send({result:'ok'});
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
										res.send({result:'error'});
									}
									else {
										res.send({result:'ok'});
									}
									connection.release();
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
					res.sendfile(records[0].data);
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
				var path = req.files.file ? req.files.file.path : '';
				var name = req.files.file ? req.files.file.originalname : '';
				connection.query("insert into documents(user, name, theme, " +
					" data_type, data_name, data) " +
					" values(?, ?, ?, 'file', ?, ?)",
					[req.session.info.id, req.body.name, req.body.theme,
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
		});
	}
});

router.get('/document-list', function(req, res) {
	if (req.session.info == null) {
		res.send([]);
	}
	else {
		pool.getConnection(function(error, connection) {
			if (error) {
				res.send([]);
			}
			else {
				connection.query("select * from documents where user=?",
				[req.session.info.id],
				function(error, records) {
					res.send(records);
					connection.release();
				});
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
	pool.getConnection(function(error, connection) {
		if (error) {
			res.send({result:'error'});
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
					res.send({result:'ok'});
				}
				else {
					res.send({result:'error'});
				}
				connection.release();
			});
		}
	});

});

router.get('/logout', function(req, res) {
	req.session.destroy();
	res.render('logout.html', { title: title });
});

router.get('/debug', function(req, res) {
	res.send([]);
});

router.get('/debug-stock', function(req, res) {
	// res.send([]);
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
