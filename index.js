const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
require('dotenv').config();
const fileUpload = require('express-fileupload');
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.w7kbq.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority";
const ObjectId = require('mongodb').ObjectId; 

const port = 5000;
var app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('clientProjects'));
app.use(fileUpload());

app.get('/', (req, res)=>{
    res.send("Hello World")
});

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const adminCollection = client.db("wifiService").collection("admins");   
    const orderCollection = client.db("wifiService").collection('orders');
    const clientCommentsCollection = client.db("wifiService").collection('clientReview');
    const serviceCollection = client.db("wifiService").collection('services');
   

    
    app.post('/addAdmin', (req, res)=>{
        const admin = req.body;
        // console.log(admin);
        adminCollection.insertOne(admin)
        .then(result =>{
            // console.log(result);
            res.send(result);
        });
    })

    app.get('/admins', (req, res)=>{
        const queryEmail = req.query.email;
        // console.log(queryEmail);
        adminCollection.find({email: queryEmail})
        .toArray((err, documents) =>{
            // console.log(documents);
            res.send(documents);
        });
    })

    // This work is for admin panel..
    app.post('/addOrder', (req, res)=>{
        const customerEmail = req.body.customerEmail;
        const action = req.body.action;  
        const actionBG = req.body.actionBG;  
        const actionColor = req.body.actionColor;  
        const name = req.body.name;  
        const price = req.body.price;  
        const email = req.body.email;  
        const projectTitle = req.body.projectTitle;  
        const projectDetails = req.body.projectDetails;
        
        
        // console.log(action,actionBG,actionColor,name,email,projectTitle,projectDetails,price,file);
       

        orderCollection.insertOne({customerEmail,name,email,action,actionBG,actionColor,projectTitle,projectDetails,price})
        then(result =>{
            // console.log(result);
         res.send(result.insertedCount > 0);

                })
            })
    
    //update action style
    app.patch('/clients/:id', (req, res) =>{
        const id = req.params.id;
        // console.log(req.body.action,req.body.actionBG, req.body.actionColor)
        // console.log(id);
        orderCollection.updateOne({_id: ObjectId(id)},
        {
            $set: {action: req.body.action,actionBG: req.body.actionBG, actionColor: req.body.actionColor}
        })
        .then(result => {
            res.send(result.modifiedCount > 0);
        })
    })

   
    app.post('/addServices', (req, res)=>{
        const adminEmail = req.body.adminEmail;
        const title = req.body.title;  
        const description = req.body.description;
        const price = req.body.price;
        const file = req.files.file;

        const filePath = `${__dirname}/addedServices/${file.name}`;
            file.mv(filePath, (err) => {
                if(err){
                    console.log(err);
                    res.status(500).send({msg: 'Failed to upload image'});
                }
                const newImg = fs.readFileSync(filePath);
                const encImg = newImg.toString('base64');

                const image = {
                    contentType: file.mimetype,
                    size: file.size,
                    img: Buffer(encImg, 'base64')
                };

                serviceCollection.insertOne({adminEmail,title,description,price,image})
                .then(result => {
                    fs.remove(filePath, error => {
                    if(error){
                        console.log(error);
                    }
                    res.send(result.insertedCount > 0);
                })
            })
        })
    })
app.delete('/deleteService/:id', (req, res) => {
    serviceCollection.findOneAndDelete({_id: ObjectID (req.params.id)})
    .then( (result) => {
        res.send(result.deletedCount > 0);
    })
})

    // This work is for customer
    app.get('/services', (req, res) =>{
        serviceCollection.find({})
        .toArray( (err, documents) =>{
            // console.log(documents);
            res.send(documents); 
        })
    })

    app.get('/services/:id', (req, res) =>{
        const id = req.params.id;
        serviceCollection.findOne({_id: ObjectId(id)})
        .then(document => {
            // console.log(document);  
            res.send(document);
        })
    })

    // post order to server
    app.post('/singleOrder', (req, res) => {
        const event = req.body;
        orderCollection.insertOne(event)
            .then(result => {
                console.log(result)
                res.send(result)
            })
    })

        app.get('/clients/email', (req, res) =>{
            const queryEmail = req.query.checkedEmail;
            // console.log(queryEmail);
            orderCollection.find({customerEmail: queryEmail})
            .toArray( (err, documents) =>{
            // console.log(documents);
            res.send(documents); 
            })
        })

        app.post('/clientComments', (req, res)=>{
            const comment = req.body;
            // console.log(comment);
            clientCommentsCollection.insertOne(comment)
            .then(result => {
                res.send(result.insertedCount > 0);
            })
        })

        app.get('/clientComments', (req, res) =>{
            clientCommentsCollection.find({})
            .toArray( (err, documents) =>{
            // console.log(documents);
            res.send(documents); 
            })
        })
    });
app.listen(process.env.PORT || port)