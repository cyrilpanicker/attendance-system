var express=require('express');
var bodyParser=require('body-parser');
var Db = require('mongodb').Db;
var Server = require('mongodb').Server;
var service=require('./service');
var ObjectID = require('mongodb').ObjectID;

var passport = require('passport');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var cookie = require('cookie');
var LdapStrategy = require('passport-ldapauth');
var MongoStore = require('connect-mongo')(session);

var serializeLdapUser = function (user,done) {
	done(null,{
		userName : user.uid,
		name : user.cn,
		email : user.mail
	});
};

var deserializeLdapUser = function (user,done) {
	return done(null,user);
};

var sessionStore = new MongoStore({
	host:'localhost',
	port:27017,
	db:'dashDb'
});
 
var sessionOptions = {
	secret:'there-is-no-secret',
	saveUninitialized: true,
	resave:false,
	store:sessionStore,
	cookie:{
		httpOnly:true,
		maxAge:86400000
	}
};

var ldapOptions = {
	server: {
		"url": "ldap://glbdirqr.global.us.shldcorp.com:389",
		"searchBase": "ou=people,o=intra,dc=sears,dc=com",
		"searchFilter": "(uid={{username}})",
		"usernameField":"uid",
		"passwordField":"userPassword"
	}
};

var app=express();

app.use(bodyParser.json());

app.use(express.static('public'));

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LdapStrategy(ldapOptions));
passport.serializeUser(serializeLdapUser);
passport.deserializeUser(deserializeLdapUser);

var db=new Db('dashDb',new Server('localhost',27017),{safe:true});
db.open(function (error,db) {
	if (error) {
		console.log('error occured while opening connection to database');
	} else {

		app.get('/members',function (request,response) {
			service.getMembers(db)
			.then(function (members){
				response.send(members);
			},function (error){
				response.status(500).send(error)
			});
		});

		app.post('/updateOwner',function (request,response) {
			service.updateOwner(db,request.body.memberId,request.body.passphrase,{
				shift:request.body.shift,
				year:request.body.year,
				month:request.body.month,
				day:request.body.day
			})
			.then(function (message){
				response.send(message)
			},function (error){
				if (error=='passphrase-incorrect') {
					response.status(409).send(error);
				} else {
					response.status(500).send(error);
				}
			});
		});

		app.get('/getOwner',function (request,response) {
			service.getOwner(db,{
				"shift":request.query.shift,
				"year":parseInt(request.query.year),
				"month":parseInt(request.query.month),
				"day":parseInt(request.query.day)
			})
			.then(function (owner){
				response.send(owner);
			},function (error){
				response.status(500).send(error);
			});
		});

		app.post('/authorizeRosterEdit',function (request,response) {
			service.authenticateMember(db,'admin',request.body.passphrase)
			.then(function (message){
				response.send(message);
			},function (error){
				if (error=='passphrase-incorrect' || error=='admin-passphrase-incorrect') {
					response.status(409).send(error);
				} else {
					response.status(500).send(error);
				}
			});
		});

		app.post('/enter',function (request,response) {
			service.enterAttendance(db,request.body.memberId,request.body.passphrase)
			.then(function (message){
				response.send(message);
			},function (error){
				if (error=='passphrase-incorrect' || error=='attendance-already-marked') {
					response.status(409).send(error);
				} else {
					response.status(500).send(error);
				}
			});
		});

		app.post('/bulkUpdate',function (request,response) {
			service.bulkUpdate(db,request.body.members,request.body.dateRange,request.body.shift)
			.then(function (message) {
				response.send(message);
			},function (error) {
				response.status(500).send(error);
			});
		});

		app.get('/shiftPlan',function (request,response) {
			service.getShiftPlan(db,parseInt(request.query.month),parseInt(request.query.year))
			.then(function (plan) {
				response.send(plan);
			},function (error) {
				response.status(500).send(error);
			});
		});

		app.post('/deleteEntry',function (request,response) {
			service.deleteEntry(db,request.body.memberId,{
				shift:request.body.shift,
				year:request.body.year,
				month:request.body.month,
				day:request.body.day
			})
			.then(function (message){
				response.send(message);
			},function (error){
				response.status(500).send(error);
			});
		});

		app.get('/shiftDetails',function (request,response) {
			response.send(service.getShiftDetails());
		});

		app.get('/membersInShift',function (request,response) {
			service.getMembersInShift(db,{
				shift:request.query.shift,
				year:parseInt(request.query.year),
				month:parseInt(request.query.month),
				day:parseInt(request.query.day)
			})
			.then(function (members){
				response.send(members);
			},function (error){
				response.status(500).send(error);
			});
		});

		app.get('/report',function (request,response) {
			var startDate=new Date(parseInt(request.query.startYear),parseInt(request.query.startMonth),parseInt(request.query.startDay));
			var endDate=new Date(parseInt(request.query.endYear),parseInt(request.query.endMonth),parseInt(request.query.endDay));
			service.getReport(db,startDate,endDate)
			.then(function (report){
				response.send(report);
			},function (error){
				response.status(500).send(error);
			});
		});

		app.post('/enterBridge',function (request,response){
			service.enterBridgeDetails(db,request.body.bridgename,request.body.bridgeType,request.body.bridgeTime,request.body.shift,request.body.selectkeywords,request.body.year,request.body.month,
				request.body.day,request.body.duration,request.body.primaryParticipants,request.body.secondaryParticipants,request.body.briefsummary,request.body.solution,request.body.contactDL,
				request.body.OBUjira,request.body.SGjira,request.body.RCAjira,request.body.priority)
			.then(function (message){
				response.send(message);
			}, function (error){
				response.status(500).send(error);
			});
		});

		app.get('/bridgeSearch',function (request,response){
			var startDate=new Date(parseInt(request.query.startYear),parseInt(request.query.startMonth),parseInt(request.query.startDay));
			var endDate=new Date(parseInt(request.query.endYear),parseInt(request.query.endMonth),parseInt(request.query.endDay));
			service.getBridge(db,startDate,endDate)
			.then(function (message){
				response.send(message);
			}, function (error){
				response.status(500).send(error);
			});
		});

		app.post('/login',function (req,res,next) {
			passport.authenticate('ldapauth',{session:true},function (err,user,info) {
				if (err) {
					res.status(500).send({message:'Ldap Connection Error'});
				} else if (!user) {
					res.status(403).send(info);
				} else {
					req.logIn(user,function (err) {
						if (err) {
							res.status(500).send({message:'Session Error'});
						} else {
							res.send({
								userName : user.uid,
								name : user.cn,
								emailId : user.mail
							});
						}
					});
				}
			})(req,res,next);
		});

		app.post('/logout',function (req,res) {
			if (!req.user) {
				res.status(409).send('user-not-signed-in');
			} else {
				req.logout();
				res.send({message:'user-signed-out'});
			}
		});

		app.get('/user',function (req,res,next) {
			if (!req.user) {
				res.send({})
			} else {
				res.send(req.user);
			}
		});

		app.listen(8000,function () {
			console.log('server listening at port 8000');
		});
	}
});
