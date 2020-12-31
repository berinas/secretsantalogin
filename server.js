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
app.set('engine', 'ejs');


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
		var query = "SELECT * FROM employees";
    	connection.query(query,function(err,result){
        	if(err)
            	throw err;
       	 	else {
				console.log(result);
				response.render('admin-homepage.ejs', { employees: result });
            	response.end();
		}
    });
	} else {
		response.send('Please login to view this page!');
	}
});

app.get('/logout', function(request, response) {
	request.session.destroy();
	response.redirect('/');
});

/*app.get('/admin-homepage.html',function(req,res) {
    var query = "SELECT * FROM employees";
    connection.query(query,function(err,result){
        if(err)
            throw err;
        else {
            res.render('employees.ejs', { employees: result });
            res.end();
        }
    });
});*/

app.listen(3000);
