const express=require('express')
const app=express();
const Port=process.env.Port || 3000;
const bodyParser=require('body-parser')
const mongoose=require('mongoose')
const path=require('path')
const User=require('./models/user')
const {registerValidation,loginValidation}=require('./validation');
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')


mongoose.connect('mongodb+srv://rhino11:rhino11@cluster0.klzdx.mongodb.net/pagination?retryWrites=true&w=majority');

mongoose.connection.on('connected',connected=>{
    console.log("connect with database")
})

app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())

function  paginatatedresult(model){

    return async (req,res,next)=>{
        const page=parseInt(req.query.page);
        const limit=parseInt(req.query.limit);

        const startIndex=(page-1)*limit;
        const endIndex=page*limit;

        console.log(startIndex,endIndex)

        const result={}

        if(endIndex < await model.countDocuments().exec()){
            result.next={
                page:page+1,
                limit:limit,
            }
        }

        if(startIndex > 0){
            result.previous={
                page:page-1,
                limit:limit,
            }
        }
            try{
            result.result=await model.find({}).sort({name:-1}).limit(limit).skip(startIndex).exec()
            res.paginatatedresult=result
            next();
        }catch(err){
            res.send(err);
        }
    }
}

//pagination-skip,limit,sort

app.get('/user',paginatatedresult(User),async (req,res)=>{
res.json(res.paginatatedresult)
})


//selection key-select user by id

app.get('/iduser/:id',async (req,res)=>{
    const result=await User.findById(req.params.id)
    res.send(result)

    })

//search a user using regex
app.get('/search',async (req,res)=>{
    const searchFieldName=req.query.name;
    const searchFieldEmail=req.query.email;

    var regex1=new RegExp(searchFieldName,'i')
    var regex2=new RegExp(searchFieldEmail,'i')
    await User.find({name:regex1,email:regex2})
    .then(data=>{
        res.send(data);
    })
    })
// get all user
app.get('/alluser',async (req,res)=>{
   const result=await User.find({})
   res.json(result)
    })

//add user
app.post('/adduser',async (req,res)=>{

    //lets validate the data before we a user
    const validation=registerValidation(req.body)
    
    if(validation.error) return res.status(400)
    .send(validation.error.details[0].message)

    //checking if user is already in database
    const emailexist=await User.findOne({email:req.body.email})
    if(emailexist) return res.status(400).send('email already exists')
    
    //hash the password
    const salt=await bcrypt.genSalt(10);
    const hashpassword=await bcrypt.hash(req.body.password,salt);


    //create a new user
    const user=new User({
        name:req.body.name,
        email:req.body.email,
        password:hashpassword,
       
    });

    try{
        const savedUser=await user.save()
        res.send(savedUser)
    }
    catch(err){
        res.status(400).json({
            errName:err
        });
    }

})




app.listen(Port,()=>console.log(`server is running on ${Port}`))