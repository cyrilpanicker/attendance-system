attendanceSystem
================

**application to track members in a give shift**

***Steps to build and run the application.***

-install mongodb

-clone the git repository.

-use the below dommand to import date from `attendanceSystem/data.csv` to mongodb.
`mongoimport -d dashDb -c members --type csv --file data.csv --headerline`
the data will be imported to `members` collection under `dashDb` database.

-use the below command to install nodejs dependencies. the command should be run from `attendanceSystem` root folder.
`npm install`

-use the below command to run the application. the command should be run from `attendanceSystem` root folder.
`node server.js`

-point browser at `http://127.0.0.1:8000/`.
