attendanceSystem
================

**application to track members in a given shift**

***Steps to build and run the application.***


* make sure the system is running on CST time zone.


* install mongodb and nodejs


* clone the git repository.


* use the below command to start mongodb daemon process.  
`mongod`  
mongodb executables need to be in path. or run the command from `/bin` directory in mongodb installation folder.


* use the below command to import data from `attendanceSystem/data.csv` to mongodb.  
`mongoimport -d dashDb -c members --type csv --file data.csv --headerline`  
the data will be imported to `members` collection under `dashDb` database.  
mongodb executables need to be in path. or copy `attendanceSystem/data.csv` to `/bin` directory in mongodb installation folder and run the command from `/bin` directory.

* use the below command to import data from `attendanceSystem/passphrases.csv` to mongodb.  
`mongoimport -d dashDb -c passphrases --type csv --file passphrases.csv --headerline`  
the data will be imported to `passphrases` collection under `dashDb` database.  
mongodb executables need to be in path. or copy `attendanceSystem/passphrases.csv` to `/bin` directory in mongodb installation folder and run the command from `/bin` directory.

* use the below command to install nodejs dependencies.  
`npm install`  
the command should be run from `attendanceSystem` root folder.  


* use the below command to run the application.  
`node server.js`  
the command should be run from `attendanceSystem` root folder.  


* point browser to `http://127.0.0.1:8000/`.  


***Quick tips***
* command to export members collection to csv file:  
`mongoexport -d dashDb -c members -f "_id,name" -o memberName.csv --csv`
