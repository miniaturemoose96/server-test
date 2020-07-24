const { json } = require('body-parser');
// set dependencies 
const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');

// set port and express application
const PORT = 8888;
const app = express();

// set up middleware, help parse JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded())

// connect to mongodb atlas
mongoose.connect('mongodb+srv://alejandro-dev1:minimoose96@cluster0.m5pfu.mongodb.net/test-database?retryWrites=true&w=majority', {useNewUrlParser: true});

// Successful or unsuccesful
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log('Connection Successful.');
});

// create the journal schema
const journalSchema = new mongoose.Schema({
    id: String,
    title: String,
    decrip: String
});

// Create a new journal
// just pass in schema
const Journal = mongoose.model('Journal', journalSchema);

// test entry
// Our Schema Works
// const entry = new Journal({
//     id: "1",
//     title: "Captain's Log",
//     decrip: "Some star trek log reference."
// });

// setting REST api endpoints
// First we set a get
app.get("/hello", (req, res) => {
    res.send("HELLO WORLD!");
});

// endpoint for saving new blogs
app.post('/add-journal', (req, res) => {
    const journalData = req.body;
    console.log(journalData);
    res.send(journalData)
    // const newJournal = new Journal(journalData);
    
    // // save the journal
    // newJournal.save((err, document) => {
    //     if(err){
    //         res.status(500).send({
    //             err: err,
    //             message: 'an error occured.'
    //         })
    //     }

    //     res.status(200).json(document);
    // })
})


// endpoint for retirieving
// app.get('/retrieve-journals', (req, res) =>{

// });

// set server to listen on the port given
app.listen(PORT, () => {
    console.log(`Server listening on Port: ${PORT}`);
});