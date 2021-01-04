var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var nodemailer = require('nodemailer');

var connection = mysql.createPool({
	host     : 'remotemysql.com',
	user     : 'UR4egJqhNC',
	password : 'DJEASXHE8M',
	database : 'UR4egJqhNC'
});

var mail = nodemailer.createTransport({
	host: 'smtp.gmail.com',
    port: 465,
	auth: {
	  user: 'cyclone.logs@gmail.com',
	  pass: 'cyclonelogs2020'
	}
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
		connection.query('SELECT * FROM employees WHERE email = ? AND password = ?', [email, password], function(error, users, fields) {
			if (users.length > 0) {
				request.session.loggedin = true;
				request.session.email = email;
				if (users[0].role == "Admin") {
					response.redirect('/admin-homepage');
				} else {
					response.redirect('/employee-homepage');
				}
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
		var query = "SELECT e.id as id, e.name as name, e.email as email, COALESCE(e2.name, 'no paired employee') as pair FROM employees e LEFT JOIN employees e2 ON e.paired_employee_id = e2.id WHERE e.role <> 'Admin'";
    	connection.query(query,function(err,employees){
        	if(err)
            	throw err;
       	 	else {
				connection.query("SELECT role FROM employees WHERE email = ?", [request.session.email], function(err,results){
					if(results[0].role !== "Admin") {
						response.send('You do not have permission to see this page');
					}
					else {
						response.render('admin-homepage.ejs', { employees: employees });
            			response.end();
					}
				});
		}
    });
	} else {
		response.send('Please login to view this page!');
	}
});

app.get('/employee-homepage', function(request, response) {
	if (request.session.loggedin) {
    	connection.query("SELECT e.name FROM employees e LEFT JOIN employees e2 ON e.id = e2.paired_employee_id WHERE e2.email = ?", [request.session.email], function(err,paired_employee){
        	if(err)
            	throw err;
       	 	else {
				connection.query("SELECT role FROM employees WHERE email = ?", [request.session.email], function(err,results){
					if(results[0].role !== "Employee") {
						response.send('You do not have permission to see this page');
					}
					else {
						response.render('employee-homepage.ejs', { paired_employee: paired_employee });
						response.end();	
					}
				});
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

app.post('/adduser', function(request, response) {
	
	if (request.session.loggedin) {
		console.log(request.body);
		let pass = Math.random().toString(36).substring(7);
		
    	connection.query('INSERT INTO employees (name, email, password, role) VALUES (?, ?, ?, ?)', [request.body.name, request.body.email, pass, request.body.roles], function(err,result){
        	if(err)
            	throw err;
       	 	else {
				
				var mailOptions = {
					from: 'cyclone.logs@gmail.com',
					to: request.body.email,
					subject: 'Welcome to secret santa',
					text: 'Welcome ' + request.body.name + ', your password is: ' + pass
				};

				mail.sendMail(mailOptions, function(error, info){
					if (error) {
					  console.log(error);
					} else {
					  console.log('Email sent: ' + info.response);
					}
				});
				
				response.redirect('/admin-homepage');
            	response.end();
			}
    	});
	} else {
		response.send('Please login to view this page!');
	}
	
});

//granicni slucaj: 2 osobe - jedna dodijeljena drugoj - ne smiju biti 2 para- pa jedna ostaje neuparena
app.get('/generate', function(request, response) {
	
	if (request.session.loggedin) {

		
		var query = "SELECT * FROM employees WHERE role <> 'Admin'";
    	connection.query(query,function(err,result){
        	if(err)
            	throw err;
       	 	else {
				let employees_id = [];
				result.forEach( (row) => {
					employees_id.push(row.id);
				  });

				  
				shuffle(employees_id);

				employees_id.forEach(function(item, index, array) {
					if (index+1 < employees_id.length) 
						var query = "UPDATE employees SET paired_employee_id = '" + employees_id[index+1]+ "' WHERE id = '" + item +"'";
					else	
						var query = "UPDATE employees SET paired_employee_id = '" + employees_id[0]+ "' WHERE id = '" + item +"'";

					connection.query(query,function(err,result){
					if(err)
						throw err;
					});
					//console.log(query);
				  });
				  //console.log('');

				response.redirect('/admin-homepage');
            	response.end();
		}
    });
	} else {
		response.send('Please login to view this page!');
	}
	
});

//  https://github.com/jessabean/secret-santa-js/blob/master/js/app.js
function shuffle(array) {
    let counter = array.length;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        let index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}

app.listen(3000);
