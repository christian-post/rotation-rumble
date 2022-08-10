const { MongoClient } = require('mongodb');
require("dotenv").config();


let dbConnection;


module.exports = {
  connectToDb: callback => {
    const url = `mongodb+srv://${process.env.DBUSER}:${process.env.PASSWORD}@cluster0.59u2j.mongodb.net/?retryWrites=true&w=majority`;
    MongoClient.connect(url)
      .then(client => {
        console.log('connected to database');

        listDatabases(client);

        dbConnection = client.db('rotation-rumble');
        return callback();
      })
      .catch(err => {
        console.log(err);
        return callback(err);
      });
  },
  getDb: ()=> dbConnection
}


async function listDatabases(client){
  databasesList = await client.db().admin().listDatabases();

  console.log("Databases:");
  databasesList.databases.forEach(db => console.log(` - ${db.name}`));
};