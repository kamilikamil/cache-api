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
//inserts data for a given key
function insertData(key, value) {
  return new Promise((resolve, reject) => {
    getAllItems(async function (error, result) {
      if (error) {
        reject(error);
        return;
      }

      //check if cache is full
      if (result.length > (process.env.MAX_ENTRIES || 10)) {
        console.log("Cache is full. Will overwrite the key with oldest ttl");

        return dbConnection
          .collection("cache")
          .find({})
          .sort({ ttl: -1 })
          .limit(1)
          .toArray(async function (error, oldCache) {
            if (error) {
              reject(error);
              return;
            }
            const cache = oldCache[0];

            const date = getNewDate();

            try {
              await updateData(cache.key, {
                value,
                ttl: date,
              });

              resolve({ key: cache.key, value, state: "updated" });
              return;
            } catch (error) {
              reject(error);
              return;
            }
          });
      }

      const date = getNewDate();

      const data = {
        key,
        value,
        ttl: date,
      };

      try {
        await dbConnection.collection("cache").insertOne(data);
      } catch (error) {
        if (error.code && error.code === 11000) {
          console.error(`Key: ${key} already exists. Overwriting data`);
          try {
            await updateData(key, { value });

            resolve({ key, value, state: "updated" });
          } catch (error) {
            console.dir(error);
            reject(error);
          }
        } else {
          console.error("Error writing data");
          reject(error);
        }

        return;
      }

      return resolve({ key, value, state: "inserted" });
    });
  });
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
