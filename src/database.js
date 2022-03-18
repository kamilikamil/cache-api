const { MongoClient } = require("mongodb");

const connectionString = process.env.MONGODB_DATABASE_URI;

const client = new MongoClient(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let dbConnection;

function getNewDate() {
  const date = new Date().getTime() + (1000 * process.env.TTL_SECONDS || 10);

  return new Date(date);
}
//updates the data for a given key
async function updateData(key, value) {
  try {
    await dbConnection.collection("cache").updateOne(
      { key },
      {
        $set: value,
      }
    );
  } catch (error) {
    console.error(`Error updating data for key ${key} with values: ${value}`);
    return Promise.reject(error);
  }

  return Promise.resolve();
}

function getAllItems(callback) {
  dbConnection
    .collection("cache")
    .find({})
    .toArray(function (error, result) {
      if (error) {
        callback(error, null);
        return;
      }
      callback(null, result);
      return;
    });
}

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
