const express = require('express');
const app = express();
const bodyParser = require('body-parser');

var mongo = require("mongodb");
var ObjectId = mongo.ObjectId;
var MongoClient = mongo.MongoClient;

var db_url = "mongodb://localhost:27017/global";

var dbTest = {};
MongoClient.connect(db_url, { useNewUrlParser: true }, function(err, dbConnection) {
  if (err) throw err;
  console.log("Database connected!");
  dbTest.Connection=dbConnection;//connection object
  dbTest.dbConnection = dbConnection.db();//.db("global");
  let dbConn=dbTest.dbConnection;

  dbTest.Teacher = dbConn.collection('teacher');
  dbTest.Student = dbConn.collection('student');
});

app.use(bodyParser.json({
    limit: '50mb'
}));

app.use(function(req, res, next) {
    req.dbTest = dbTest;
    res.setHeader('Access-Control-Allow-Headers', 'Origin, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Response-Time, X-PINGOTHER, X-CSRF-Token, authorization');
    res.setHeader('Access-Control-Allow-Methods', "GET, POST, OPTIONS, PUT, DELETE");
    res.setHeader('Access-Control-Max-Age', '1000');
    var method = (req.method).toUpperCase();
    if (method == "OPTIONS") {
        return res.json({
            status: "ok"
        });
    }
    next();
});

// app.use(function(req,res,next){
//     req.dbTest = dbTest;
//     next();
// });


app.use('/api',require('./routes/teacherController'));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    return res.json(err);
});


app.listen(8080,()=>{
console.log("app started on 8080 port");
});