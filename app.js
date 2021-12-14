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
const verify=require('./routes/verifyToken')

mongoose.connect('mongodb+srv://rhino11:rhino11@cluster0.klzdx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority');

mongoose.connection.on('connected',connected=>{
    console.log("connect with database")
})

app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())




//private route access when token is verified
app.get('/',verify,(req,res)=>{
    res.send(req.user);
    
})

//SIGN UP
app.post('/signup',async (req,res)=>{

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

    // res.status(200).json({
    //     name:req.body.name,
    //     email:req.body.email,
    //     password:req.body.password,
    // })
})

//LOGIN
app.post('/login',async (req,res)=>{

    //lets validate the data before we a user
    const validation=loginValidation(req.body)
    
    if(validation.error) return res.status(400)
    .send(validation.error.details[0].message)

    //checking if user is already in database
    const user=await User.findOne({email:req.body.email})
    if(!user) return res.status(400).send('email not found')
    
    //PASSWORD is CORRECT
    const validpassword=await bcrypt.compare(req.body.password,user.password)
    if(!validpassword) return res.status(400).send('Invalid password')

    //create and assign a token
    const token=jwt.sign({_id:user._id},'gautam123')
    res.header('auth-token',token).status(200).json({
        user:user._id,
        token:token
    })
  

    

})




app.listen(Port,()=>console.log(`server is running on ${Port}`))