const { MongoClient } = require("mongodb");

const connectionString = process.env.MONGODB_DATABASE_URI;

const client = new MongoClient(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let dbConnection;

module.exports = {
  connectToServer: function (callback) {
    client.connect(function (err, db) {
      if (err || !db) {
        return callback(err);
      }

      dbConnection = db.db("simple_cache");

      dbConnection
        .collection("cache")
        .createIndex({ key: 1 }, { unique: true });

      return callback();
    });
  },

  getDb: function () {
    return dbConnection;
  },
};
