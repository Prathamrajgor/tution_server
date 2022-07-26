const express=require("express");
const app =express();
const mongoose=require("mongoose");
const dotenv=require("dotenv");
dotenv.config();
const cors=require("cors");
const mysql=require("mysql2");
const fast2sms=require("fast-two-sms");
const schema=require("./schema");
const { response } = require("express");
const path=require("path");
const sqlite3=require("sqlite3").verbose()

const db=new sqlite3.Database("./student.db",sqlite3.OPEN_READWRITE,(err)=>{
    if(err){
        console.log("Error:",err);
    }
    else{
        console.log("Connection to sqlite3 database successfull");   
    }
});


console.log(schema);

let token='';

app.use(cors());

function CsrfToken(length) {
    var result='';
    var characters='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * 
        charactersLength));
    }
    return result;
};

app.use(express.json());



app.use((req,res,next)=>{
    console.log("Data: ",req.body);

    // Middleware to check for SQL injections
    console.log("MiddleWare used");
    let val=Object.values(req.body);
    let found=false;
    console.log(val);
    console.log(typeof(val));
    for(let i=0;i<Object.values(req.body).length;i++){
        let m=String(val[i]);
            if(m.includes("--") || m.includes("OR")  || m.includes("'") || m.includes("UNION") || m.includes("SELECT") ||m.includes("*") || m.includes("FROM") || m.includes("AND")){
                console.log("SQLi Attempted");
                res.send("Haha, SQL INJECTION would not work here. Try somewhere else");
                found=true;
                break;
            }
    }
    if(found==false){
        next();
    }
});

mongoose.connect(process.env.DB,()=>{
    // console.log(process.env.DATABASE)
    console.log("Connection to Database successfull");
},(err)=>{
    console.log(err);
});

function generateOTP() {
    // Declare a digits variable 
    // which stores all digits
    var digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 6; i++ ) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
}

const pool=mysql.createPool({
    host:String(process.env.DB_HOST),
    user:String(process.env.DB_USER),
    database:String(process.env.DB_NAME),
    password:String(process.env.DB_PASSWORD)
});


let sql="SHOW TABLES;"
pool.execute(sql,(err,result)=>{
    console.log(err);
    console.log(result);
});

app.use(express.static(path.join("./build")))

app.get("/",(req,res)=>{
   res.sendFile(path.resolve(__dirname,"build","index.html"));
});

app.post("/auth",(req,res)=>{
    if(req.body.code=="ritagor121234"){
        token=CsrfToken(24)
        res.send({
            state:"s",
            token:token
        });
    }
    else{
        res.send("u");
    }
});


app.use((req,res,next)=>{
    
    console.log(req.body.token);
    
    next()
})

// console.log(CsrfToken(24));



app.post("/add_student", (req,res)=>{
    let d=new Date;
    // console.log(String(d.getFullYear())+"-"+String(d.getMonth()+1)+"-"+String(d.getDate()));
    let a=String(d.getFullYear())+"-"+String(d.getMonth()+1)+"-"+String(d.getDate());

    console.log(req.body);
     db.run(`INSERT INTO student(
         student_id,
         firstname,
         lastname,
         std,
         school_name,
         mother_name,
         father_name,
         contact,
         joining_date,
        fees
     ) VALUES(
        ${generateOTP()},
        '${req.body.firstname}',
        '${req.body.lastname}',
        '${req.body.std}',
        '${req.body.school}',
        '${req.body.mother}',
        '${req.body.father}',
        '${req.body.contact}',
        '${req.body.date}',
        '${req.body.fees}'
    );`,async (err,result)=>{
        if(err){
            console.log(err);

            // Saved for Later Try  
            // let x=await fast2sms.sendMessage({
            //     authorization:process.env.API_KEY,
            //     message:`Thank you, ${req.body.firstname} ${req.body.lastname} for Joining Maharaja tutions `,
            //     numbers:["9819510933"]
            // })
            // console.log(x);

           
            console.log(err);
            res.send("u")
        }
        else{
            console.log("Successfull");
            res.send("s");
        }
    })
});

app.get("/student_list",(req,res)=>{
    db.all("SELECT * FROM student;",[],(err,result)=>{
        console.log("Result: ",result);
        res.json(result);
    })
});

app.put("/edit_student",(req,res)=>{
    console.log(req.body);
    db.run(`UPDATE student SET
        firstname='${req.body.firstname}',
        lastname='${req.body.lastname}',
        std='${req.body.std}',
        school_name='${req.body.school}',
        mother_name='${req.body.mother}',
        father_name='${req.body.father}',
        contact='${req.body.contact}',
        joining_date='${req.body.date}',
        fees='${req.body.fees}'
        WHERE student_id='${Number(req.body.student_id)}';
     `,async (err,result)=>{
         if(err){
             console.log(err);
             res.send("u");
         }
         else{
             console.log(result);
             res.send("s");
         }
     })
});

app.put("/delete_student",(req,res)=>{
    if(req.body==""){
        res.send("u");
    }
    else{
        console.log(req.body);
        db.run(`DELETE FROM student WHERE student_id='${req.body.student_id}';`,(err,result)=>{
            if(err){
                console.log(err);
                res.send("u");
            }
            else{
                console.log(result);
                res.send("s");
            }
        })
    }
});


app.post("/add_fees",(req,res)=>{
    console.log(req.body.month.toLowerCase());

    db.all(`SELECT ${req.body.month.toLowerCase()} FROM student WHERE student_id='${req.body.student_id}';`,[],(err,result_1)=>{
        if(err){
            console.log(err);
            res.send("u")
        }
        else{
            if(Object.values(result_1[0])[0]!="0"){
                console.log("exists");
                res.send("u");
            }
            else{
                db.run(`UPDATE student SET ${req.body.month.toLowerCase()}='${req.body.fees_and_date}' WHERE student_id='${req.body.student_id}';`,(err,result)=>{
                    if(err){
                        res.send("u");
                    }
                    else{
                        res.send("s");
                    }
                });
            }
        }
    });

});

app.post("/edit_fees",(req,res)=>{
    console.log(req.body);

    db.run(`UPDATE student SET ${req.body.month.toLowerCase()}='${req.body.fees_and_date}' WHERE student_id='${req.body.student_id}';`,(err,result)=>{
        if(err){
            res.send("u");
        }
        else{
            res.send("s");
        }
    });
});

app.post("/delete_fees",(req,res)=>{
    console.log(req.body);
    db.run(`UPDATE student SET ${req.body.month.toLowerCase()}='0' WHERE student_id='${req.body.student_id}'`,(err,result)=>{
        if(err){
            console.log(err);
            res.send("u");
        }
        else{
            console.log(result);
            res.send("s");
        }
    });
});


app.listen(process.env.PORT,()=>{
    console.log(`Listening on Port ${process.env.PORT}`);
});




setInterval(()=>{
    // Backup data to mongoDB cluster 
    db.all("SELECT * FROM student;",[],(err,result)=>{
        if(err){
            console.log(err);
        }
        else{
            console.log(result[2]);
            db.all("SELECT * FROM student;",[],(err,result)=>{
                let date=new Date();
                if(err){
                    console.log(err);
                }
                else{
                    schema.find({}, async(err,response)=>{
                        if(response.length==0){
                            console.log("lenght: ",response.length);
                        }
                        else{
                            schema.deleteMany({},(err,result2)=>{
                                if(err){
                                    console.log("Error:",err);
                                }
                                else{
                                    console.log("result:",result);
                                    for(let i=0;i<result.length;i++){
                                        let a =result[i];
                                        schema.create({
                                            time:String(new Date()),
                                            data:{
                                                student_id:a.student_id,
                                                firstname:a.firstname,
                                                lastname:a.lastname,
                                                std:a.std,
                                                school_name:a.school_name,
                                                mother_name:a.mother_name,
                                                father_name:a.father_name,
                                                contact:a.contact,
                                                joining_date:a.joining_date,
                                                fees:a.fees,
                                                june:a.june,
                                                july:a.july,
                                                august:a.august,
                                                september:a.september,
                                                october:a.october,
                                                november:a.november,
                                                december:a.december,
                                                january:a.january,
                                                february:a.february,
                                                march:a.march,
                                                april:a.april,
                                                may:a.may
                                            }
                                        });
                                    }
                                    console.log(result[0].july);
            
                                }
                            })
            
                        }
                    })
                }
            });
        }
    })
},1000*60*60*24);

