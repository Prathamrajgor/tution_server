const express=require("express");
const app =express();
const cors=require("cors");
// const mysql=require("mysql2");
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




app.use(express.static(path.join("./build")))

app.get("/",(req,res)=>{
   res.sendFile(path.resolve(__dirname,"build","index.html"));
});




app.use((req,res,next)=>{
    
    console.log(req.body.token);
    
    next()
})

// console.log(CsrfToken(24));



app.post("/add_student", (req,res)=>{
    let d=new Date;
    console.log("Adddd   ");
    // console.log(String(d.getFullYear())+"-"+String(d.getMonth()+1)+"-"+String(d.getDate()));
    let a=String(d.getFullYear())+"-"+String(d.getMonth()+1)+"-"+String(d.getDate());

    console.log("Body:",req.body);
     db.run(`INSERT INTO student(
        student_id, firstname, lastname, std, school_name, mother_name, father_name,contact, joining_date, fees 
     ) VALUES(
        '${generateOTP()}',
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
            console.log("Error: ",err);

           
            console.log("Result",result);
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


app.get("*",(req,res)=>{
    res.redirect("http://localhost:5000/")
})

app.listen(5000,()=>{
    console.log(`Listening on Port 5000`);
});





