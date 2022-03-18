const { MongoClient } = require("mongodb");
const uuid = require("uuid");

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

//if a key is found it returns cached data
//otherwise inserts random string
async function findOneOrInsert(key) {
  let findResult;

  try {
    findResult = await dbConnection.collection("cache").findOne({ key });
  } catch (error) {
    console.error("Error finding data");
    return Promise.reject(error);
  }

  //data not found
  if (!findResult) {
    console.log(`Key: ${key}, not found. Generating random string instead.`);

    try {
      const value = uuid.v4();
      const response = await insertData(key, value);
      return Promise.resolve(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  //ttl expired
  if (new Date(findResult.ttl).getTime() < new Date().getTime()) {
    console.log(
      `Key: ${findResult.key}, ttl is expired. Generating random string instead.`
    );

    const date = getNewDate();

    try {
      const value = uuid.v4();

      await updateData(findResult.key, {
        value: uuid.v4(),
        ttl: date.toISOString(),
      });

      return Promise.resolve({ key: findResult.key, value });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  //everything checked out so lets update ttl
  const date = getNewDate();

  const value = uuid.v4();

  try {
    await updateData(findResult.key, {
      value,
      ttl: date,
    });

    return Promise.resolve({ key: findResult.key, value, state: "found" });
  } catch (error) {
    return Promise.reject(error);
  }
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

  add: function (key, value) {
    return insertData(key, value);
  },

  getValue: function (key) {
    return findOneOrInsert(key);
  },

  getAllValues: function () {
    return new Promise((resolve, reject) => {
      getAllItems(function (error, result) {
        if (error) {
          reject(error);
          return;
        }

        const withoutIDs = result.map((item) => {
          delete item._id;

          return item;
        });

        resolve(withoutIDs);
      });
    });
  },

  removeItem: function (key) {
    return new Promise((resolve, reject) => {
      dbConnection
        .collection("cache")
        .deleteOne({ key }, function (error, result) {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
    });
  },

  removeAll: function () {
    return new Promise((resolve, reject) => {
      dbConnection.collection("cache").deleteMany({}, function (error, result) {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  },
};
