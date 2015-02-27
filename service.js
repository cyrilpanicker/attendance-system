var config=require('./config.json');
var dbService = require('./dbService.js');
var Promise = require('bluebird');


var getMembers=function (db) {
	return dbService.get(db,'members')
	.then(function (members){
		return Promise.resolve(members);
	},function (){
		return Promise.reject('db-error');
	});
};

var authenticateMember=function (db,memberId,passphrase) {
	return dbService.getOne(db,'passphrases',{'memberId':memberId})
	.then(function (member){
		if (!member) {
			return Promise.reject('passphrase-not-setup');
		} else if (member.passphrase!==passphrase) {
			if (memberId=='admin') {
				return Promise.reject('admin-passphrase-incorrect');
			} else {
				return Promise.reject('passphrase-incorrect');
			}
		} else if (member.passphrase===passphrase) {
			if (memberId=='admin') {
				return Promise.resolve('admin-authenticated');
			} else {
				return Promise.resolve('member-authenticated');
			}
		} 
	},function (){
		return Promise.reject('db-error');
	})
};

var enterBridgeDetails=function (db,bridgename,bridgeType,bridgeTime,shift,selectkeywords,year,month,day,duration,primaryParticipants,secondaryParticipants,briefsummary,solution,contactDL,OBUjira,SGjira,RCAjira,priority){
	var bridgeTimeCST = timeConverterISTtoCST(bridgeTime);
	return getOwner(db,
		        {shift:shift,
				year:year,
				month:month,
				day:day})
   .then(function (owner){
		var ShiftOwner;
		if (owner && owner.name) {
			ShiftOwner = owner.name;
			
		}else{
               ShiftOwner = "NA";
		}
	return dbService.insert(db,'bridgeDetails',{
				bridgename:bridgename,
				bridgeType:bridgeType,
				bridgeTime:bridgeTimeCST,
				shift:shift,
				selectkeywords:selectkeywords,
				year:year,
				month:month,
				day:day,
				duration:duration,
				primaryParticipants:primaryParticipants,
				secondaryParticipants:secondaryParticipants,
				briefsummary:briefsummary,
				solution:solution,
				contactDL:contactDL,
				OBUjira:OBUjira,
				SGjira:SGjira,
				RCAjira:RCAjira,
				ShiftOwner:ShiftOwner,
				priority:priority
			})
    .then(function (){
		return Promise.resolve('Bridge Details Submitted Successfully.');
	},function (){
		return Promise.reject('Database error occured while saving Bridge details');
	});
 },function (error){
		if (!error) {
			return Promise.reject('Database error occured while saving Bridge details');
		} else {
			return Promise.reject(error);
		}
	});   
};

var timeConverterISTtoCST = function(ISTtime){
	    var timeStr = ISTtime;
		var parts = timeStr.split(':');
		var hour = parseInt(parts[0].trim());
		var minutes = parseInt(parts[1].trim());
		hour -= config.timeConvertion.offsetHours;
		minutes -= config.timeConvertion.offsetMinuts;

		if(hour <= 0){
		    hour += 24;
		   }
		 if(minutes < 0){
		  	hour = hour -1;
		  	minutes = 60 + minutes;
		  }
		  if( minutes === 60){
		  	hour = hour +1;
		  	minutes = 00;
		  }

		timeStr = hour + ':' + minutes;

		return timeStr;

};

var enterAttendance=function (db,memberId,passphrase) {

	var shiftDetails=getShiftDetails();
	var shift=shiftDetails.currentShift.shift;
	var year=shiftDetails.currentShift.year;
	var month=shiftDetails.currentShift.month;
	var day=shiftDetails.currentShift.day;

	return authenticateMember(db,memberId,passphrase)
	.then(function (){
		return dbService.getOne(db,'entries',{
			memberId:memberId,
			shift:shift,
			year:year,
			month:month,
			day:day
		});
	},function (error){
		return Promise.reject(error);
	})
	.then(function (entry){
		if (entry) {
			return Promise.reject('attendance-already-marked-'+shift);
		} else {
			return dbService.insert(db,'entries',{
				memberId:memberId,
				shift:shift,
				year:year,
				month:month,
				day:day
			});
		}
	},function (error){
		if (!error) {
			return Promise.reject('db-error');
		} else {
			return Promise.reject(error);
		}
	})
	.then(function (){
		return Promise.resolve('attendance-marked-'+shift);
	},function (error){
		if (!error) {
			return Promise.reject('db-error');
		} else {
			return Promise.reject(error);
		}
	});
};

var deleteEntry=function (db,memberId,shiftDetails) {
	var ownerEntryRemoved=dbService.remove(db,'owners',{
		memberId:memberId,
		shift:shiftDetails.shift,
		year:shiftDetails.year,
		month:shiftDetails.month,
		day:shiftDetails.day
	});
	var entryRemoved=dbService.remove(db,'entries',{
		memberId:memberId,
		shift:shiftDetails.shift,
		year:shiftDetails.year,
		month:shiftDetails.month,
		day:shiftDetails.day
	});
	return Promise.all([ownerEntryRemoved,entryRemoved])
	.then(function (){
		return Promise.resolve('entry-deleted');
	},function (error){
		return Promise.reject('db-error');
	});
};

var updateOwner=function (db,memberId,passphrase,shiftDetails) {
	return authenticateMember(db,memberId,passphrase)
	.then(function (){
		return dbService.getOne(db,'owners',shiftDetails);
	},function (error){
		return Promise.reject(error);
	})
	.then(function (owner){
		if (owner) {
			return dbService.update(db,'owners',owner,{$set:{'memberId':memberId}});
		} else {
			return dbService.insert(db,'owners',{
				shift:shiftDetails.shift,
				year:shiftDetails.year,
				month:shiftDetails.month,
				day:shiftDetails.day,
				memberId:memberId
			});
		}
	},function (error){
		if (!error) {
			return Promise.reject('db-error');
		} else {
			return Promise.reject(error);
		}
	})
	.then(function (){
		return Promise.resolve('owner-updated-'+shiftDetails.shift);
	},function (error){
		if (!error) {
			return Promise.reject('db-error');
		} else {
			return Promise.reject(error);
		}
	});
};

var getOwner = function (db,shiftDetails) {
	return dbService.getOne(db,'owners',shiftDetails)
	.then(function (owner){
		if (!owner) {
			return Promise.resolve({});
		} else {
			return dbService.getOne(db,'members',{'_id':owner.memberId});
		}
	},function (){
		return Promise.reject('db-error');
	})
	.then(function (member){
		if (!member) {
			reject('member-details-not-found');
		} else {
			return Promise.resolve(member);
		}
	},function (error){
		if (error) {
			return Promise.reject(error);
		} else {
			return Promise.reject('db-error');
		}
	});
};

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
	var S1Start=new Date(year,month,day,config.timings.S1.start.hr,config.timings.S1.start.min);
	var S3End=new Date(year,month,day,config.timings.S3.end.hr,config.timings.S3.end.min);	
	var S2Start=new Date(year,month,day,config.timings.S2.start.hr,config.timings.S2.start.min);
	var S1End=new Date(year,month,day,config.timings.S1.end.hr,config.timings.S1.end.min);
	var S3Start=new Date(year,month,day,config.timings.S3.start.hr,config.timings.S3.start.min);
	var S2End=new Date(year,month,day,config.timings.S2.end.hr,config.timings.S2.end.min);
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

	if (date>=zero && date<S1Start) {

		shiftDetails.currentShift.shift='S3';
		setDateForCurrentShift(addDays(date,-1));

	} else if (date>=S1Start && date<S3End) {

		shiftDetails.previousShiftEnded=false;
		shiftDetails.currentShift.shift='S1';
		shiftDetails.previousShift.shift='S3';
		setDateForCurrentShift(date);
		setDateForPreviousShift(addDays(date,-1));

	} else if (date>=S3End && date<S2Start) {

		shiftDetails.currentShift.shift='S1';
		setDateForCurrentShift(date);

	} else if (date>=S2Start && date<S1End) {

		shiftDetails.previousShiftEnded=false;
		shiftDetails.currentShift.shift='S2';
		shiftDetails.previousShift.shift='S1';
		setDateForCurrentShift(date);
		setDateForPreviousShift(date);

	} else if (date>=S1End && date<S3Start) {

		shiftDetails.currentShift.shift='S2';
		setDateForCurrentShift(date);

	} else if (date>=S3Start && date<S2End) {

		shiftDetails.previousShiftEnded=false;
		shiftDetails.currentShift.shift='S3';
		shiftDetails.previousShift.shift='S2';
		setDateForCurrentShift(date);
		setDateForPreviousShift(date);

	} else if (date>=S2End && date<zeroNext) {

		shiftDetails.currentShift.shift='S3';
		setDateForCurrentShift(date);

	} else {
		console.log('error in determining shift details');
	}

	return shiftDetails;
};

var getMembersInShift=function (db,shiftDetails) {
	var members=[];
	return dbService.get(db,'entries',shiftDetails)
	.then(function (entries){
		if (!entries.length) {
			return Promise.resolve(members);
		} else {
			var promises=[];
			for (var i = entries.length - 1; i >= 0; i--) {
				var promise=dbService.getOne(db,'members',{'_id':entries[i].memberId})
				.then(function (member){
					if (!member) {
						return Promise.reject('member-details-not-found');
					} else {
						members.push(member);
						return Promise.resolve();
					}
				},function (){
					return Promise.reject('db-error');
				})
				promises.push(promise);
			};
			return Promise.all(promises);
		}
	},function (){
		return Promise.reject('db-error');
	})
	.then(function (){
		return Promise.resolve(members);
	},function (error){
		return Promise.reject(error);
	});
};

var getGroupedMembers=function (members) {
	var groupedMembers={};
	groupedMembers['FE']=0;
	groupedMembers['SAL']=0;
	groupedMembers['UCUP']=0;
	groupedMembers['UPAS']=0;
	for (var i = members.length - 1; i >= 0; i--) {
		switch(members[i].module1){
			case 'FE': groupedMembers['FE']++; break;
			case 'SAL': groupedMembers['SAL']++; break;
			case 'UC-UP': groupedMembers['UCUP']++; break;
			case 'UPAS': groupedMembers['UPAS']++; break;
		}
	};
	return groupedMembers;
};

var getReport=function (db,startDate,endDate) {

	var shifts=['S1','S2','S3'];
	var report=[];
	var reportComplete=[];

	for(var date=startDate; date<=endDate; date=addDays(date,1)){

		(function (date) {
			var datum={
				S1:{},
				S2:{},
				S3:{}
			};
			var datumUpdated=[];

			datum.date=date.getFullYear()+'/'+(parseInt(date.getMonth())+1)+'/'+date.getDate();

			for (var i = shifts.length - 1; i >= 0; i--) {
				(function (i) {
					var membersUpdated=getMembersInShift(db,{
						shift:shifts[i],
						year:date.getFullYear(),
						month:date.getMonth(),
						day:date.getDate()
					})
					.then(function(members){
						datum[shifts[i]].members=getGroupedMembers(members);
						return Promise.resolve();
					},function(error){
						return Promise.reject(error);
					});
					var ownerUpdated=getOwner(db,{
						shift:shifts[i],
						year:date.getFullYear(),
						month:date.getMonth(),
						day:date.getDate()
					})
					.then(function(owner){
						datum[shifts[i]].owner=owner.name;
						return Promise.resolve();
					},function(error){
						return Promise.reject(error);
					});
					var shiftUpdated=Promise.all([membersUpdated,ownerUpdated]);
					datumUpdated.push(shiftUpdated);
				})(i);
			};

			var reportUpdated=Promise.all(datumUpdated)
			.then(function(){
				report.push(datum);
				return Promise.resolve();
			},function(error){
				return Promise.reject(error);
			})

			reportComplete.push(reportUpdated);
		})(date);
	}

	return Promise.all(reportComplete)
	.then(function(){
		return Promise.resolve(report);
	},function(error){
		return Promise.reject(error);
	});
};

var getBridge=function (db,startDate,endDate) {

	var report=[];
	var reportComplete=[];

	for(var date=startDate; date<=endDate; date=addDays(date,1)){

		(function (date) {
			var datum={};
			var datumUpdated=[];

			datum.date=date.getFullYear()+'/'+(parseInt(date.getMonth())+1)+'/'+date.getDate();

              var dayBridge = getBridgesInDay(db,{
						year:date.getFullYear(),
						month:date.getMonth(),
						day:date.getDate()
					})
                 .then(function(bridges){
						datum.bridges = bridges;
						if(bridges && bridges.length >0){
							datum.showData = true;
							datum.noOfBridges = bridges.length;
						}else{
							datum.showData = false;
						}
						return Promise.resolve();
					},function(error){
						return Promise.reject(error);
					});
            var bridgeUpdated=Promise.all([dayBridge])
			.then(function(){
				report.push(datum);
				return Promise.resolve();
			},function(error){
				return Promise.reject(error);
			})

			reportComplete.push(bridgeUpdated);
		})(date);
	}

	return Promise.all(reportComplete)
	.then(function(){
		return Promise.resolve(report);
		console.log(report);
	},function(error){
		return Promise.reject(error);
	});
};

var getBridgesInDay=function (db,queries) {
	var bridges=[];
    var dataBridge =[];
	return dbService.get(db,'bridgeDetails',queries)
	.then(function (entries){
		if (!entries.length) {
			return Promise.resolve(bridges);
		} else {
			dataBridge = entries;
			/* for (var i = 0;i<= dataBridge.length - 1;i++) {
				bridges.push(entries(i));
			   }*/
		}
	  },function (){
		return Promise.reject('db-error');
	})
	.then(function (){
		return Promise.resolve(dataBridge);
	},function (error){
		return Promise.reject(error);
	});
};

module.exports=exports={
	getMembers:getMembers,
	authenticateMember:authenticateMember,
	updateOwner:updateOwner,
	getOwner:getOwner,
	enterAttendance:enterAttendance,
	deleteEntry:deleteEntry,
	getMembersInShift:getMembersInShift,
	getShiftDetails:getShiftDetails,
	getReport:getReport,
	enterBridgeDetails:enterBridgeDetails,
	getBridge:getBridge
};

// var getShiftTimings=function (shift,year,month,day) {
// 	var shiftTimings={};
// 	switch(shift){
// 		case 'S1': 
// 		shiftTimings.fromTime=new Date(year,month,day,3,0);
// 		shiftTimings.toTime=new Date(year,month,day,10,15);
// 		break;
// 		case 'S2':
// 		shiftTimings.fromTime=new Date(year,month,day,10,15);
// 		shiftTimings.toTime=new Date(year,month,day,19,0);
// 		break;
// 		case 'S3':
// 		shiftTimings.fromTime=new Date(year,month,day,19,0);
// 		var nextDay=addDays(shiftTimings.fromTime,1);
// 		year=nextDay.getFullYear();
// 		month=nextDay.getMonth();
// 		day=nextDay.getDate();
// 		shiftTimings.toTime=new Date(year,month,day,3,0);
// 	}
// 	return shiftTimings;
// };