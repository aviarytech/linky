const { MongoClient } = require("mongodb");

const connectionUrl =
  "mongodb+srv://admin:AviaryTech123@cluster0-asppv.mongodb.net/test?retryWrites=true&w=majority";
const dbName = "linky";

let db;

const init = () =>
  MongoClient.connect(connectionUrl, { useNewUrlParser: true }).then(client => {
    db = client.db(dbName);
  });

const insertItem = item => {
  const collection = db.collection("users");
  return collection.insertOne(item);
};

const getItems = () => {
  const collection = db.collection("users");
  return collection.findOne({});
};

module.exports = { init, insertItem, getItems };
