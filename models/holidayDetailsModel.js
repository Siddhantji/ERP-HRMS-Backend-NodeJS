const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
holidayTitle:{
    type:String,
    required:true
},
date:{
    type:String,
    required:true
},
type:{
    type:String,
    required:true
},
month:{
    type:String,
    enum:["January","February","March","April","May","June","July","August","September","October","November","December"],
    required:true
},
location:{
    type:String,
    required:true
}
})

module.exports= mongoose.model("holiday",holidaySchema);

