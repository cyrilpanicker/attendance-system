var dbService = require('./dbService.js');
var Promise = require('bluebird');

var getOwner = function (db,shiftDetails) {
	return dbService.getOne(db,'owners',shiftDetails)
	.then(function (owner){
		if (!owner) {
			return Promise.resolve({});
		} else {
			return dbService.getOne(db,'members',{'_id':owner.memberId});
		}
	},function (){
		return Promise.reject('Database error occured while fetching owner details.');
	})
	.then(function (member){
		if (!member) {
			reject('Member details were not found for shift owner.');
		} else {
			return Promise.resolve(member);
		}
	},function (error){
		if (error) {
			return Promise.reject(error);
		} else {
			return Promise.reject('Database error occured while fetching member details for shift owner.');
		}
	});
};

var getOwnerReport=function (db,startDate,endDate) {

	var report=[];
	
	var startYear=startDate.getFullYear();
	var startMonth=startDate.getMonth();
	var startDay=startDate.getDate();

	var endYear=endDate.getFullYear();
	var endMonth=endDate.getMonth();
	var endDay=endDate.getDate();

	var startDate=new Date(startYear,startMonth,startDate);
	var endDate=new Date(endYear,endMonth,endDate);

	for(var date=startDate; date <= endDate; date=addDays(date,1)){
		var object={};
		object.date=date.toLocaleDateString();
		var promise1=getOwner(db,{
			year:date.getFullYear(),
			month:date.getMonth(),
			day:date.getDate()
			shift:'S1'
		})
		.then(function (member){
			object['S1']=member.name;
		},function (error){
			return Promise.reject(error);
		});
		var promise2=getOwner(db,{
			year:date.getFullYear(),
			month:date.getMonth(),
			day:date.getDate()
			shift:'S2'
		});
		var promise3=getOwner(db,{
			year:date.getFullYear(),
			month:date.getMonth(),
			day:date.getDate()
			shift:'S3'
		});
		Promise.all(promise1,promise2,promise3)
		.then(function (response){
			
		},function (errorResponse){
			
		});
	}

};

module.exports=exports={
	getOwner:getOwner
};