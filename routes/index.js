"use strict";

var express	= require('express');
var router	= express.Router();
var mysql	= require('mysql');
var crypto	= require('crypto');
var http    = require('http');

var title = "OpenBI";
var OK    = { result: "ok" };
var ERROR = { result: "error" };

var pool = mysql.createPool({
	host		: "localhost",
	user		: "openbi",
	password	: "p@ssword",
	database	: "openbi"
});

function log(e) {
	// console.log(e);
}

router.get("/", function(req, res) {
	if (req.session.info == null) {
		res.redirect("/login")
		return;
	}
	pool.getConnection(function(error, db) {
		if (error) {
			res.send(ERROR);
			log(error);
			return;
		}
		db.query("select * from documents where user=?",
		[req.session.info.id],
		function(error, records) {
			res.render("index.html", {
				title: title,
				document: records
			});
			db.release();
		});
	});
});

router.get("/document-list", function(req, res) {
	if (req.session.info == null) {
		res.send(ERROR);
		return;
	}
	pool.getConnection(function(error, db) {
		if (error) {
			res.send(ERROR);
			log(error);
			return;
		}
		db.query("select * from documents where user=?",
		[req.session.info.id],
		function(error, records) {
			var result = OK;
			result.data = records;
			res.send(result);
			db.release();
		});
	});
});

router.get("/document", function(req, res) {
	res.redirect("/");
});

router.get("/document/:id", function(req, res) {
	pool.getConnection(function(error, db) {
		if (error) {
			res.redirect("/");
			log(error);
			return;
		}

		var user = req.session.info == null ? 0 : req.session.info.id;
		var id = req.params.id;
		db.query(
			"select * from documents where id=? and (user=? or public=1)",
			[id, user],
		function (error, records) {
			if (error || records.length === 0) {
				res.redirect("/");
				db.release();
				return;
			}
			db.query("select * from objects where document=?",
				[id],
			function(error, objects) {
				if (error) {
					res.redirect("/");
					db.release();
					return;
				}

				if (records[0].data_type === "file") {
					records[0].data = "/" + records[0].data;
				}
				if (records[0].data_type === "url") {
					records[0].data_url = records[0].data;
				}
				if (records[0].init == null) {
					records[0].init = "";
				}

				var host = req.protocol + "://";
				if (req.get("x-forwarded-host") == null) {
					host += req.get("host");
				}
				else {
					host += req.get("x-forwarded-host");
				}

				res.render("absolute.html", {
					title: title + ' ' + records[0].name,
					host: host,
					user: user,
					document: records[0],
					charts: objects
				});
				db.release();
			});
		});
	});
});

router.post("/document-delete/:id", function(req, res) {
	if (req.session.info == null) {
		res.send(ERROR);
		return;
	}

	pool.getConnection(function(error, db) {
		if (error) {
			res.send(ERROR);
			log(error);
			return;
		}
		var id   = req.params.id;
		var user = req.session.info.id;
		var sql  = "delete from documents where id=? and user=?";
		db.query(sql, [id, user], function(error, records) {
			if (error) {
				res.send(ERROR);
			}
			else {
				res.send(OK);
			}
			db.release();
		});
	});
});

router.post("/document-save", function(req, res) {
	if (req.session.info == null) {
		res.redirect("/document/" + req.body.document);
		return;
	}
	var user     = req.session.info.id;
	var document = parseInt(req.body.document);
	var pub      = req.body.public === "on" ? 1 : 0;
	var init     = req.body.init;
	var dataType = req.body.data;

	pool.getConnection(function(error, db) {
		if (error) {
			res.redirect("/document/" + req.body.document);
			log(error);
			return;
		}
		db.query(
			"update documents set name=?, public=?, data_type=?, " +
			"init=?, style=? " +
			"where id=? and user=?",
		[req.body.name, pub, dataType, init, req.body.style, document, user],
		function(error, records) {
			if (dataType === "file") {
				var path = req.files.file ? req.files.file.path : "";
				var file = req.files.file ? req.files.file.originalname : "";
				if (path === "") {
					res.redirect("/document/" + req.body.document);
					db.release();
					return;
				}
				db.query(
					"update documents set data_name=?, data=? " +
					"where id=? and user=?",
				[file, path, document, user],
				function(error, records) {
					res.redirect("/document/" + req.body.document);
					db.release();
				});
			}
			else
			if (dataType === 'url') {
				db.query("update documents set data_name='', data=? " +
					"where id=? and user=?",
					[req.body.url, document, user],
				function(error, records) {
					res.redirect("/document/" + req.body.document);
					db.release();
				});
			}
		});
	});
});

router.post("/object-delete", function(req, res) {
	if (req.session.info == null) {
		res.send(ERROR);
		return;
	}
	pool.getConnection(function(error, db) {
		if (error) {
			res.send(ERROR);
			log(error);
			return;
		}

		var id = parseInt(req.body.id);
		var document = parseInt(req.body.document);
		db.query("select user from documents where id=?", [document],
		function(error, records) {
			if (error) {
				res.send(ERROR);
				db.release();
				return;
			}
			else
			{
				if (records[0].user === req.session.info.id) {
					db.query("delete from objects where id=?", [id],
					function(errors, records) {
						if (errors) {
							res.send(ERROR);
						}
						else {
							res.send(OK);
						}
						db.release();
					});
				}
				else {
					res.send(ERROR);
					db.release();
				}
			}
		});
	});
});

router.post("/object-save", function(req, res) {
	if (req.session.info == null) {
		res.send(ERROR);
		return;
	}
	var id = parseInt(req.body.id);
	var document = parseInt(req.body.document);
	pool.getConnection(function(error, db) {
		if (error) {
			res.send(ERROR);
			log(error);
			return;
		}
		db.query("select user from documents where id=?", [document],
		function(error, records) {
			if (error) {
				res.send(ERROR);
				db.release();
				return;
			}
			else
			{
				var type      = req.body.type;
				var dimension = req.body.dimension;
				var group     = req.body.group;

				if (records[0].user === req.session.info.id) {
					if (id === 0) {
						db.query(
							"insert into objects(document, name, " +
							" type, dimension, reduce, sort, " +
							" top, top_value, " +
							" maximize_width, maximize_height, " +
							" x, y, width, height) " +
							" values(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
						[document,
							req.body.name, type,
							dimension, group,
							req.body.sort,
							req.body.top, req.body.top_value,
							req.body.maximize_width,
							req.body.maximize_height,
							req.body.x, req.body.y,
							req.body.width, req.body.height],
						function(error, rows) {
							if (error) {
								res.send(ERROR);
							}
							else {
								res.send(OK);
							}
							db.release();
						});
					}
					else {
						db.query("update objects set " +
							" name=?, type=?, dimension=?, reduce=?," +
							" sort=?, top=?, top_value=?," +
							" x=?, y=?, width=?, height=?, " +
							" maximize_width=?, maximize_height=? " +
							" where id = ?"
						,[req.body.name, type,
							dimension, group,
							req.body.sort,
							req.body.top, req.body.top_value,
							req.body.x, req.body.y,
							req.body.width, req.body.height,
							req.body.maximize_width,
							req.body.maximize_height,
							id],
						function(error, rows) {
							if (error) {
								res.send(ERROR);
							}
							else {
								res.send(OK);
							}
							db.release();
						});
					}
				}
				else {
					res.send(ERROR);
					db.release();
				}
			}
		});
	});
});

router.get("/data", function(req, res) {
	res.send([]);
});

router.get("/data/:id", function(req, res) {
	pool.getConnection(function(error, db) {
		if (error) {
			res.send([]);
			log(error);
			return;
		}
		else {
			var user = req.session.info ? req.session.info.id : 0;
			db.query(
			"select * from documents where id=? and (user=? or public=1)",
			[req.params.id, user],
			function (error, records) {
				if (error || records.length === 0) {
					res.send([]);
				}
				else {
					if (records[0].data == null) {
						res.send([]);
					}
					else {
						res.sendfile(records[0].data);
					}
				}
				db.release();
			});
		}
	});
});

router.post("/document-create", function(req, res) {
	if (req.session.info == null) {
		res.redirect("/login");
		return;
	}
	pool.getConnection(function(error, db) {
		if (error) {
			res.redirect("/");
			log(error);
			return;
		}
		var name = req.body.name;
		if (name == null) {
			name = "";
		}
		var path = req.files.file ? req.files.file.path : "";
		var file = req.files.file ? req.files.file.originalname : "";
		if (path === "") {
			db.query("insert into documents(user, name)"+
				" values(?, ?)",
				[req.session.info.id, name],
			function(error, result) {
				if (result == null) {
					res.redirect("/");
				}
				else {
					res.redirect("/document/" + result.insertId);
				}
				db.release();
			});
		}
		else {
			db.query("insert into documents(user, name, " +
				" data_type, data_name, data) " +
				" values(?, ?, 'file', ?, ?)",
				[req.session.info.id, name, file, path],
			function(error, result) {
				if (result == null) {
					res.redirect("/");
				}
				else {
					res.redirect("/document/" + result.insertId);
				}
				db.release();
			});
		}
	});
});

router.get("/login", function(req, res) {
	if (req.session.info == null) {
		res.render("login.html", { title: title });
	}
	else {
		res.redirect("/");
	}
});

router.post("/login", function(req, res) {
	pool.getConnection(function(error, db) {
		if (error) {
			res.redirect("/login?error=Unable to connect to database");
			log(error);
			return;
		}

		var digest = crypto.createHash("sha256").update(req.body.password)
						.digest("hex");
		db.query("select * from users where email=? or user=?",
			[req.body.username, req.body.username],
		function(error, r) {
			if (error == null && r.length > 0 && r[0].password === digest) {
				req.session.info = r[0];
				res.redirect("/");
			}
			else {
				res.redirect("/login?error=Invalid user name or password");
			}
			db.release();
		});
	});
});

router.get("/about", function(req, res) {
	res.render("about.html", { title: title });
});

router.get("/editor", function(req, res) {
	res.render("editor.html", { title: title });
});

router.get("/logout", function(req, res) {
	req.session.destroy();
	res.redirect("/"); // or res.render('logout.html', { title: title });
});

router.get("/debug-stock", function(req, res) {
	res.render("debug-stock.html", { title: title });
});

router.get("/debug-background", function(req, res) {
	res.render("debug-background.html", { title: title });
});

module.exports = router;




/*
NOTE:






*/
