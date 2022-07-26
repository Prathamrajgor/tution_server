const mongoose=require("mongoose");
let studentSchema=new mongoose.Schema({
    time:String,
    data:{
        student_id:String,
        firstname:String,
        lastname:String,
        std:String,
        school_name:String,
        mother_name:String,
        father_name:String,
        contact:String,
        joining_date:String,
        fees:String,
        june:String,
        july:String,
        august:String,
        september:String,
        october:String,
        november:String,
        december:String,
        january:String,
        february:String,
        march:String,
        april:String,
        may:String,
    }
});

module.exports=schema=mongoose.model("students",studentSchema);
