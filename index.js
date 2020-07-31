// set dependencies 
require('dotenv').config();

const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const cors = require('cors');
const mongooseUniqueValidator = require('mongoose-unique-validator');

// Token
const accessTokenSecret = process.env.JWT_TOKEN;

// set port and express application
const PORT = process.env.PORT || 8888;
const app = express();

// set up middleware, help parse JSON
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// connect to mongodb atlas
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Successful or unsuccesful
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('Connection Successful.');
});

// create the journal schema
const journalSchema = new mongoose.Schema({
    id: String,
    title: String,
    decrip: String
});

// creates new schema for user sign up
const userSchema = new mongoose.Schema({
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, unique: true, required: [true, 'Field Required!'], index: true },
    password: { type: String, required: [true, 'Field Required'], index: true }
    // Have one more, maybe array of journals created
}, { timestamps: true });

userSchema.plugin(mongooseUniqueValidator, { message: 'already in use.' });


// using the schema we have defined, create a new Journal
const Journal = mongoose.model('Journal', journalSchema);

// Using new schema, create a new Person
const Person = mongoose.model('Person', userSchema);

/** 
 * ===============================
 *      JOURNAL Endpoints
 * ===============================
*/

// endpoint for saving new blogs
app.post('/add-journal', (req, res) => {
    const journalData = req.body;
    const newEntry = new Journal(journalData);

    // save the journal
    newEntry.save((err, document) => {
        if (err) {
            res.status(500).send({
                err: err,
                message: 'an error occured.'
            });
        }
        res.status(200).send({
            message: 'Journal Saved!',
            status: 200,
            data: document
        });
    });
});


// endpoint for retirieving
app.get('/view-journals', (req, res) => {
    Journal.find((err, documents) => {
        if (err) {
            res.status(500).send({
                err: err,
                message: 'No journals are found.'
            });
        }


        res.status(200).json(documents);
    });
});


/** 
 * ===============================
 *      Create USER Endpoints
 * ===============================
*/

// User post
app.post('/add-user', (req, res) => {
    // get data
    let userData = req.body;

    // take the password and use bcrypt to hash it
    bcrypt.hash(userData.password, 10).then((hash) => {
        saveUser(hash);
    }).catch((err) => {
        if (err) {
            res.status(500).send({
                err: err,
                message: 'Error occured'
            });
        }
    })

    function saveUser(hash) {
        userData.password = hash;
        const newUser = new Person(userData);

        newUser.save((err, document) => {
            if (err) {
                res.status(500).send({
                    err: err,
                    message: 'Error occured'
                });
            } else {
                /*
                * Generate JWT for each user
                */
                jwt.sign({
                    email: document.email
                }, accessTokenSecret, (err, accessToken) => {
                    if (err) {
                        res.status(500).send({
                            err: err,
                            message: 'Cannot generate token'
                        });
                    } else {
                        res.status(200).send({
                            message: 'User Created!',
                            status: 200,
                            data: document,
                            token: accessToken
                        });
                    }
                });
            }

        });
    }

    // create new model instance
    // const newUser = new Person(userData);


});

// verify user login
app.post('/auth', (req, res) => {
    // first pull out hashed pasword using the email
    let user = req.body;

    if (!("email" in user)) {
        res.status(500).send({
            message: 'Please provide an email.'
        });
    } else {
        Person.findOne({ email: user.email }, (err, document) => {

            if (err) { // handles db errors like validation
                res.status(500).send({
                    message: 'DB error',
                    error: err
                });
            } else if (document === null) { // check if document exists/ if user exists
                res.status(500).send({
                    message: 'No user found with that email'
                });
            } else { /// handle if the user does not exists
                checkPassword(document);
            }
        });
    }

    // once you have the email you want to use the bcryp compare method
    // bcrypt.compare()

    function checkPassword(document) {
        // handle bcrypt compare
        bcrypt.compare(user.password, document.password, (err, result) => {
            if (err) {
                console.log(err);
                // handlers errors with compare method
                res.status(500).send({
                    err: err
                })
            }
            else if (result) {
                // passwords do mathc
                const doc = document.toObject();
                delete doc.password;
                genToken(doc);
            } else {
                // passwords dont mathc
                res.status(500).send({
                    message: 'Password is incorrect.'
                });
            }
        })

    }

    function genToken(document) {
        jwt.sign({
            email: document.email
        }, accessTokenSecret, (err, accessToken) => {
            if (err) {
                res.status(500).send({
                    err: err,
                    message: 'Cannot generate token'
                });
            } else {
                res.status(200).send({
                    message: 'User Created!',
                    status: 200,
                    data: document,
                    token: accessToken
                });
            }
        });
    }

    // once you have th result of the campre method 1. handle error "invalid password" 2. handle success gen a jwt token for the new session
});


// set server to listen on the port given
app.listen(PORT, () => {
    console.log(`Server listening on Port: ${PORT}`);
});