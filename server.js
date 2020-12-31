var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');


var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : 'password',
	database : 'secretsantasystem'
});

var app = express();
app.use(express.static(__dirname + '/css'));
app.use(express.static(__dirname + '/images'));


app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.get('/', function(request, response) {
	response.sendFile(path.join(__dirname + '/login.html'));
});

app.post('/auth', function(request, response) {
	var email = request.body.email;
	var password = request.body.password;
	if (email && password) {
		connection.query('SELECT * FROM employees WHERE email = ? AND password = ?', [email, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.email = email;
				response.redirect('/admin-homepage');
			} else {
				response.send('Incorrect Email and/or Password!');
			}			
			response.end();
		});
	} else {
		response.send('Please enter Email and Password!');
		response.end();
	}
});

app.get('/admin-homepage', function(request, response) {
	if (request.session.loggedin) {
		response.sendFile(path.join(__dirname + '/admin-homepage.html'));
	} else {
		response.send('Please login to view this page!');
	}
});

app.get('/logout', function(request, response) {
	request.session.destroy();
	response.redirect('/');
});

app.listen(3000);
