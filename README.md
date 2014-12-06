attendanceSystem
================

**application to track members in a give shift**

***Steps to build and run the application.***


* make sure the system is running on CST time zone.


* install mongodb


* clone the git repository.


* use the below command to start mongodb daemon process
`mongod`
mongodb executables need to be in path. or run the command from mongodb installation folder.


* use the below command to import date from `attendanceSystem/data.csv` to mongodb.  
`mongoimport -d dashDb -c members --type csv --file data.csv --headerline`  
the data will be imported to `members` collection under `dashDb` database.
mongodb executables need to be in path. or copy `attendanceSystem/data.csv` to mongodb installation folder and run the command from mongodb installation folder.


* use the below command to install nodejs dependencies.  
`npm install`  
the command should be run from `attendanceSystem` root folder.  


* use the below command to run the application.  
`node server.js`  
the command should be run from `attendanceSystem` root folder.  


* point browser at `http://127.0.0.1:8000/`.
