var getShiftDetailsFromDate=function (date) {

	var shiftDetails={};

	var year=date.getFullYear();
	var month=date.getMonth();
	var day=date.getDate();

	var setShiftDetails=function (date,shift) {
		shiftDetails.year=date.getFullYear();
		shiftDetails.month=date.getMonth();
		shiftDetails.day=date.getDate();
		shiftDetails.shift=shift;
	};

	var addDays=function(date, days) {
		var result = new Date(date);
		result.setDate(date.getDate() + days);
		return result;
	};

	var zero=new Date(year,month,day,0,0);
	var three=new Date(year,month,day,3,0);	
	var tenAndQuarter=new Date(year,month,day,10,15);
	var nineteen=new Date(year,month,day,19,0);
	var zeroNext=addDays(new Date(year,month,day,0,0),1);

	if (date>=zero && date<three) {
		setShiftDetails(addDays(date,-1),'S3');
	} else if (date>=three && date<tenAndQuarter) {
		setShiftDetails(date,'S1');
	} else if (date>=tenAndQuarter && date<nineteen) {
		setShiftDetails(date,'S2');
	} else if (date>=nineteen && date<zeroNext) {
		setShiftDetails(date,'S3');
	} else {
		console.log('error in determining shift details');
	}

	return shiftDetails;
};

var logDetails=function (shiftDetails) {
	console.log(new Date(shiftDetails.year,shiftDetails.month,shiftDetails.day).toDateString()+' : '+shiftDetails.shift+' shift');
}

logDetails(getShiftDetailsFromDate(new Date(2015,3,1,2,0)));
logDetails(getShiftDetailsFromDate(new Date(2015,3,1,3,30)));
logDetails(getShiftDetailsFromDate(new Date(2015,3,1,10,30)));
logDetails(getShiftDetailsFromDate(new Date(2015,3,1,19,30)));
logDetails(getShiftDetailsFromDate(new Date(2015,3,2,1,0)));

