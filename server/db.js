const { MongoClient } = require("mongodb");

const connectionUrl =
  "mongodb+srv://admin:AviaryTech123@cluster0-asppv.mongodb.net/test?retryWrites=true&w=majority";
const dbName = "linky";

let db;

const init = () =>
  MongoClient.connect(connectionUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(client => {
    db = client.db(dbName);
  });

const insertItem = item => {
  const collection = db.collection("users");
  return collection.insertOne(item);
};

const getItem = userid => {
  const collection = db.collection("users");
  return collection.findOne({ userid: userid });
};

module.exports = { init, insertItem, getItem };
