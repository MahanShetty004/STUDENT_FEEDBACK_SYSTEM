const express=require("express");
const app=express();
const dotenv=require("dotenv");
dotenv.config();

const PORT=process.env.PORT;
app.get('/',(req,res)=>{
    res.send("Hello Buddy I am Working")
})

app.listen(PORT,()=>{
    console.log(`Server listening on port ${PORT}`);
})