const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId; 
const fileUpload = require('express-fileupload');

const port = 5000;
var app = express();
app.use(express.json());
app.use(cors());
app.use(express.static('services'));
app.use(fileUpload());

app.get('/', (req, res)=>{
    res.send("Hello World")
});

const user = process.env.DB_USER;
const pass = process.env.DB_PASS;
const dbname = process.env.DB_NAME;
const adminTbl = process.env.DB_ADMIN_TBL;
const orderTbl = process.env.DB_ORDER_TBL;
const feedbackTbl = process.env.DB_FEEDBACK_TBL;
const serviceTbl = process.env.DB_SERVICE_TBL;
//const uri = "mongodb+srv://internet:internet1234@cluster0.w7kbq.mongodb.net/internetService?retryWrites=true&w=majority";
const uri = `mongodb+srv://${user}:${pass}@cluster0.w7kbq.mongodb.net/${dbname}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const adminCollection = client.db(dbname).collection(adminTbl);
    const feedbackCollection = client.db(dbname).collection(feedbackTbl);
    const orderCollection = client.db(dbname).collection(orderTbl);
    const servicesCollection = client.db(dbname).collection(serviceTbl);
    
    console.log('db connected');

    // post order to server
    app.post('/singleOrder', (req, res) => {
        const event = req.body;
        orderCollection.insertOne(event)
            .then(result => {
                console.log(result)
                res.send(result)
            })
    })

    // client review order to server
    app.post('/clientFeedback', (req, res) => {
        const event = req.body;
        feedbackCollection.insertOne(event)
            .then(result => {
                console.log(result)
                res.send(result)
            })
    })

    //add new services
    app.post('/addAService', (req, res) => {
        const file = req.files.file;
        const title = req.body.title;
        const price = req.body.price;
        const description = req.body.description;
        const newImg = file.data
        const encImg = newImg.toString('base64')

        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        }

        servicesCollection.insertOne({ title, price,description, image })
            .then(result => {
                res.send(result.insertedCount > 0)
            })
    })

    // add admin to server
    app.post('/addAdmin', (req, res) => {
        const event = req.body;
        adminCollection.insertOne(event)
            .then(result => {
                console.log(result)
                res.send(result)
            })
    })

    //services
    app.get('/services', (req, res) => {
        servicesCollection.find({})
            .toArray((err, documents) => {
                res.send(documents)
            })
    })
    //Delete Service
    app.delete('/deleteService/:id', (req, res) => {
        servicesCollection.findOneAndDelete({_id: ObjectID (req.params.id)})
        .then( (result) => {
            res.send(result.deletedCount > 0);
        })
    })
    
    //client feedback
    app.get('/feedback', (req, res) => {
        feedbackCollection.find({})
            .toArray((err, documents) => {
                res.send(documents)
            })
    })

    //order
    app.get('/order', (req, res) => {
        orderCollection.find({ email: req.query.email })
            .toArray((err, documents) => {
                res.send(documents)
            })
    })

    //all admin
    app.get('/allAdmin', (req, res) => {
        adminCollection.find({})
            .toArray((err, documents) => {
                res.send(documents)
            })
    })

    //orderList
    app.get('/orderList', (req, res) => {
        orderCollection.find({})
            .toArray((err, documents) => {
                res.send(documents)
            })
    })


    //update Status
    app.patch('/updateStatus', (req, res) => {
        orderCollection.updateOne(
            { _id: ObjectId(req.body.id) },
            {
                $set: { status: req.body.newStatus },
                $currentDate: { "lastModified": true }
            }
        )
            .then(result => {
                res.send(result.modifiedCount > 0)
            })
    })

});


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(process.env.PORT || port)