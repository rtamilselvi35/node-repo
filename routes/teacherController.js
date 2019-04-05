'use strict';
const express = require('express');
var router = express.Router();
var mongo = require("mongodb");
var ObjectId = mongo.ObjectId;

//Inserting student information for the particular teacher
router.post('/register',function(req,res,next){
    if(req.body.students && req.body.students.length > 0){

        let student=[];
        req.body.students.forEach(element => {
            student.push({"student_name":element,"status":"active"});
        });
        let insertQuery = {
            "teacher":req.body.teacher,
            "students":student
        }
        req.dbTest.Teacher.insert(insertQuery,function(err,result){
        if(err){
            return next(err);
        }else{
            res.status(200).json({"status":"success","message":"data inserted successfully"});
        }
        });
        
    }else{
        res.json({"status":"failure","message":"Need Appropriate documents to store in DB"});        
    }
});

//Find common students between teachers 
router.get('/commonstudents',function(req,res,next){
    if(req.query){

        let teachers_list=[];
        if(Array.isArray(req.query.teacher)== true){
             teachers_list= req.query.teacher;
        }else{
             teachers_list.push(req.query.teacher);
        }

        let commonQuery =  [  
            {
                $match: { teacher: { $in: teachers_list } }
            },
             {
                $group: {
                    "_id":"",
                    "student_group":{$addToSet:"$students.student_name"}
                }
            },
            {
                $project: {
                            "_id":0,
                            commonToBoth: { $setIntersection: [ { $arrayElemAt: [ "$student_group", 0 ] }, {$arrayElemAt: [ "$student_group", -1 ] }] }
                        }
            }
            ];
        req.dbTest.Teacher.aggregate(commonQuery).toArray(function(err,result){
            if(err){
                return next(err);
            }else if(result.length > 0){
                res.status(200).json({"status":"success","students":result[0].commonToBoth});
            }else{
                res.status(204).json({"status":"success","message":"No matching students record found"});
            }
        });

    }else{
        res.json({"status":"failure","message":"Need Appropriate documents to get data from DB"});
    }

});

// Updating Student status to suspend
router.post('/suspend',function(req,res,next){
    if(req.body.student){

       let student_suspend = req.body.student;
       req.dbTest.Teacher.update({"students.student_name":student_suspend},{ $set: {"students.$.status":"suspended"} },{ multi: true },function(err,result){
            if(err){
                return next(err);
            }
            if(result.result.nModified > 0){
                res.status(200).json({"status":"success","message":"Student Suspended!!!"});
            }else{
                res.status(204).json({"status":"failure","message":"No matching document found for "+student_suspend});
            }
        });

    }else{
        res.json({"status":"failure","message":"Need students documents to suspend"});
    }
});

//Listing students eligible for receiving notification
router.post('/retrievefornotifications',function(req,res,next){
    if(req.body.teacher){
    let notificationQuery = 
            [   {
                    $match: {
                   
                       $or: [ { teacher: req.body.teacher } , { "students.notification" :"enable" }  ] 
                    }                    
                },
                {
                    $unwind: {
                        path : "$students",
                        preserveNullAndEmptyArrays : false
                    }
                },
                {
                    $match: {
                        $and :[{$or: [ { teacher: req.body.teacher } , { "students.notification" :"enable" }  ] },{"students.status" : { $ne:"suspended"}}] 
                    }
                },        
                {
                    $group: {
                    "_id":"",
                    "student_list":{$addToSet:"$students.student_name"}
                    }
                },
                {
                    $project: {
                      "_id":0,
                        "students_list":"$student_list"
                    }
                },
            ];     

        req.dbTest.Teacher.aggregate(notificationQuery).toArray(function(err,result){
            console.log("err,result",err,result);
            if(err){
                return next(err);
            }
            if(result[0].students_list.length > 0){
                res.status(200).json({"status":"success","recipients":result[0].students_list});
            }else{
                res.status(204).json({"status":"success","message":"No matching students record found"});
            }
        });
       

    }else{
        res.json({"status":"failure","message":"Need content to send notofication"});
    }
}); 
       
router.get('/',function(req,res,next){
    res.json({"status":"success"});
});

module.exports = router;