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
			resolve(member);
		}
	},function (error){
		if (error) {
			reject(error);
		} else {
			reject('Database error occured while fetching member details for shift owner.');
		}
	});
};

module.exports=exports={
	getOwner:getOwner
};