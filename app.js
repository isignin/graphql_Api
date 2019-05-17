// app.js
"use strict";

const express = require('express');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const config = require('./config');
const mongoose = require('mongoose');

const Event = require('./models/event');
const User = require('./models/user');

const app = express();

//connect to database
mongoose.connect(`mongodb://${config.MONGO_USER}:${config.MONGO_PW}@localhost:27017/${config.MONGO_DB}`,{ useNewUrlParser: true })
   .then(()=>{
      console.log("mongodb connected successfully...");
   }).catch(err =>{
      console.log(err);
   })
// Fix deprecationWarning for ensureIndex.
mongoose.set('useCreateIndex', true);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//Handle CORS error by allowing
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers","Origin, X-Requested-With, Content-Type, Accept,Authorization");
    if  (req.method === "OPTIONS") {
        res.header('Access-Control-Allow-Methods','PUT,POST,PATCH,DELETE,GET');
        return res.status(200).json({});
    }
    next();
 });

 app.use('/graphql', graphqlHttp({
    schema: buildSchema(`
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
            creator: String!                
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        type User {
            _id: ID!
            email: String!
            name: String!
            password: String 
            createdEvents: [String!]              
        }

        input UserInput {
            email: String!
            name: String!
            password: String!
        }

        type RootQuery {
            events: [Event!]!
            users: [User!]!
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
        events: () => {
            return Event.find()
            .then(events => {
                return events.map(event => {
                    return {...event._doc, _id: event.id };
                    //event.id is mongoose translation of the event._doc._id.toString()
                });
            })
            .catch(err => {
                throw err;
            });
        },
        createEvent: args => {
            const event = new Event({
                title: args.eventInput.title,
                description: args.eventInput.description,
                price: +args.eventInput.price,
                date: new Date(args.eventInput.date),
                creator: "5cdec68771ec0d62f6975767"
            });
            let createdEvent;
            return event.save()
              .then(result => {
                createdEvent =  { ...result._doc, _id: result.id };
                return User.findById("5cdec68771ec0d62f6975767")
              })
              .then (user => {
                  if(!user){
                    throw new Error('User does not exist');
                  }
                  user.createdEvents.push(event);
                  return user.save();
              })
              .then (result => {
                return createdEvent;
              })
              .catch(err => {
                  console.log(err);
                  throw err;
              })
            
        },
        users: () => {
            return User.find()
            .then(users => {
                return users.map(user => {
                    return {...user._doc,password: "*******", _id: user.id };
                    //event.id is mongoose translation of the event._doc._id.toString()
                });
            })
            .catch(err => {
                throw err;
            });
        },
        createUser: args => {
            return User.findOne({email: args.userInput.email})
            .then(userfound => {
                if (userfound) {
                    throw new Error('Email already exist');
                }
                const user = new User({
                    email: args.userInput.email,
                    name: args.userInput.name,
                    password: args.userInput.password
                 });
                 return user.save();
            })
            .then(result => {
            console.log(result);
            return {...result._doc, password: null, _id: result.id };
            })
            .catch(err => {
                console.log(err);
                throw err;
            })
        }
    },
    graphiql: true
 }));

 app.use((req,res,next)=>{
    const error = new Error('Not Found!');
    error.status = 404;
    next(error);
 });

 app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message,
            id: error.status
        }
    });
});

module.exports = app;
