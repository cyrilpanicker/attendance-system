
var express=require('express');
var bodyParser=require('body-parser');
var Db = require('mongodb').Db;
var Server = require('mongodb').Server;
var ObjectID = require('mongodb').ObjectID;

var app=express();

app.use(bodyParser.json());

app.use(express.static('public'));

var db=new Db('dashDb',new Server('localhost',27017),{safe:true});
db.open(function (error,db) {
	if (error) {
		console.log('error occured while opening connection to database');
	} else {

		app.get('/members',function (request,response) {
			db.collection('members').find().toArray(function (error,members) {
				if (error) {
					console.log('Database error occured while fetching member details');
					response.status(500).send('Database error occured while fetching member details');
				} else {
					console.log('Member details fetched successfully');
					response.send(members);
				}
			});
		});

		app.post('/enter',function (request,response) {

			var shiftDetails=getShiftDetails();
			var shift=shiftDetails.currentShift.shift;
			var year=shiftDetails.currentShift.year;
			var month=shiftDetails.currentShift.month;
			var day=shiftDetails.currentShift.day;

			var shiftTimings=getShiftTimings(shift,year,month,day);
			db.collection('entries').findOne({"date":{"$gte":shiftTimings.fromTime,"$lt":shiftTimings.toTime},"memberId":request.body.memberId},function (error,entries) {
				if (error) {
					console.log('Database error occured while fetching member details.');
					response.status(500).send('Database error occured while fetching member details.');
				} else if (entries) {
					response.status(409).send('Attendance is already recorded for '+shift+' shift.');
				} else {
					var entry={};
					entry.memberId=request.body.memberId;
					entry.date=new Date();
					db.collection('entries').insert(entry,function(error,result){
						if (error) {
							console.log('Database error occured while inserting entry.');
							response.status(500).send('Database error occured while inserting entry.');
						} else {
							console.log("Attendance recorded successfully for "+shift+" shift.");
							response.send("Attendance recorded successfully for "+shift+" shift.");
						}
					});
				} 
			});
		});

		app.get('/shiftDetails',function (request,response) {
			response.send(getShiftDetails());
		});

		app.get('/membersInShift',function (request,response) {
			var shift=request.query.shift;
			var year=request.query.year;
			var month=request.query.month;
			var day=request.query.day;
			var fromHours, toHours, fromMinutes, toMinutes, fromTime, toTime;
			var shiftTimings=getShiftTimings(shift,year,month,day);
			fromTime=shiftTimings.fromTime;
			toTime=shiftTimings.toTime;
			db.collection('entries').find({"date":{"$gte":fromTime,"$lt":toTime}}).toArray(function (error,entries) {
				var members=[];
				var errorOccured=false;
				if (!entries.length) {
					response.send(members);
				} 
				for (var i = entries.length - 1; i >= 0; i--) {
					var counter=0;
					db.collection('members').findOne({"_id":ObjectID(entries[i].memberId)},function (error,member) {
						counter++;
						if (error) {
							errorOccured=true;
							console.log('error occured while fetching member details');
						} else {
							members.push(member);
						}
						if (counter==entries.length) {
							if (errorOccured) {
								response.status(500).send('error occured while fetching member details');
							} else {
								response.send(members);
							}
						} 
					});
				};
			});
		});

		app.listen(8000,function () {
			console.log('server listening at port 8000');
		});
	}
});

var addDays=function(date, days) {
	var result = new Date(date);
	result.setDate(date.getDate() + days);
	return result;
};

var getShiftDetails=function () {

	var shiftDetails={};
	shiftDetails.currentShift={};
	shiftDetails.previousShift={};
	shiftDetails.previousShiftEnded=true;

	var date=new Date();
	var year=date.getFullYear();
	var month=date.getMonth();
	var day=date.getDate();

	var zero=new Date(year,month,day,0,0);
	var three=new Date(year,month,day,3,0);
	var fourAndQuarter=new Date(year,month,day,4,15);	
	var tenAndQuarter=new Date(year,month,day,10,15);
	var twelveAndQuarter=new Date(year,month,day,12,15);
	var nineteen=new Date(year,month,day,19,0);
	var nineteenAndHalf=new Date(year,month,day,19,30);
	var zeroNext=addDays(new Date(year,month,day,0,0),1);

	var setDateForCurrentShift=function (date) {
		shiftDetails.currentShift.year=date.getFullYear();
		shiftDetails.currentShift.month=date.getMonth();
		shiftDetails.currentShift.day=date.getDate();
	};

	var setDateForPreviousShift=function (date) {
		shiftDetails.previousShift.year=date.getFullYear();
		shiftDetails.previousShift.month=date.getMonth();
		shiftDetails.previousShift.day=date.getDate();
	};

	if (date>=zero && date<three) {
		shiftDetails.currentShift.shift='S3';
		setDateForCurrentShift(addDays(date,-1));
	} else if (date>=three && date<fourAndQuarter) {
		shiftDetails.previousShiftEnded=false;
		shiftDetails.currentShift.shift='S1';
		shiftDetails.previousShift.shift='S3';
		setDateForCurrentShift(date);
		setDateForPreviousShift(addDays(date,-1));
	} else if (date>=fourAndQuarter && date<tenAndQuarter) {
		shiftDetails.currentShift.shift='S1';
		setDateForCurrentShift(date);
	} else if (date>=tenAndQuarter && date<twelveAndQuarter) {
		shiftDetails.previousShiftEnded=false;
		shiftDetails.currentShift.shift='S2';
		shiftDetails.previousShift.shift='S1';
		setDateForCurrentShift(date);
		setDateForPreviousShift(date);
	} else if (date>=twelveAndQuarter && date<nineteen) {
		shiftDetails.currentShift.shift='S2';
		setDateForCurrentShift(date);
	} else if (date>=nineteen && date<nineteenAndHalf) {
		shiftDetails.previousShiftEnded=false;
		shiftDetails.currentShift.shift='S3';
		shiftDetails.previousShift.shift='S2';
		setDateForCurrentShift(date);
		setDateForPreviousShift(date);
	} else if (date>=nineteenAndHalf && date<zeroNext) {
		shiftDetails.currentShift.shift='S3';
		setDateForCurrentShift(date);
	} else {
		console.log('error in determining shift details');
	}

	return shiftDetails;
};

var getShiftTimings=function (shift,year,month,day) {
	var shiftTimings={};
	switch(shift){
		case 'S1': 
		shiftTimings.fromTime=new Date(year,month,day,3,0);
		shiftTimings.toTime=new Date(year,month,day,10,15);
		break;
		case 'S2':
		shiftTimings.fromTime=new Date(year,month,day,10,15);
		shiftTimings.toTime=new Date(year,month,day,19,0);
		break;
		case 'S3':
		shiftTimings.fromTime=new Date(year,month,day,19,0);
		var nextDay=addDays(shiftTimings.fromTime,1);
		year=nextDay.getFullYear();
		month=nextDay.getMonth();
		day=nextDay.getDate();
		shiftTimings.toTime=new Date(year,month,day,3,0);
	}
	return shiftTimings;
};