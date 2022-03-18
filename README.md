# Simple Cache API

Simple cache implementation using Express and MongoDB

## Steps:

> Make sure you have **Node** and **MongoDB** installed on your system.

> Add _.env_ file to _src_ folder. Add MongoDB URL to _MONGODB_DATABASE_URI_ in the .env file

After the above steps, run:

```
npm install

npm start
```

> Got MongoParseError?
> Make sure the _MONGODB_DATABASE_URI_ is present in the _.env_ file in the _src_ folder

## API Endpoints

Below endpoints have been implemented.

<br>

#### Add Item to cache

<br>

`POST` [http:localhost:6060/insert]

**Parameters**

|    Name | Required |  Type  | Description            |
| ------: | :------: | :----: | ---------------------- |
|   `key` | required | string | Unique key for value   |
| `value` | required | string | Value you want to save |

**Response**

```
{
    "error": null,
    "key": "k",
    "value": 1
}
```

#### Get Item from cache

<br>

`GET` [http:localhost:6060/item]

**Parameters**

|  Name | Required |  Type  | Description          |
| ----: | :------: | :----: | -------------------- |
| `key` | required | string | Unique key for value |

**Response**

```
{
    "error": null,
    "key": "hhhhhhh",
    "value": "7fcdebc5-0b0a-4f13-8a70-154f74f7c2ca"
}
```

<br>

#### Get All Items from cache

<br>

`GET` [http:localhost:6060/items]

**Parameters**

| Name | Required | Type | Description |
| ---: | :------: | :--: | ----------- |

**Response**

```
{
    "error": null,
    "values": [
        {
            "key": "hhhhhhh",
            "value": "e3a8a02a-f7b9-45ef-8545-8bbebea9028c",
            "ttl": "2022-03-18T18:25:23.845Z"
        },
        {
            "key": "k",
            "value": 1,
            "ttl": "2022-03-18T18:24:03.638Z"
        }
    ]
}
```

#### Delete Item from cache

<br>

`DELETE` [http:localhost:6060/item]

**Parameters**

|  Name | Required |  Type  | Description          |
| ----: | :------: | :----: | -------------------- |
| `key` | required | string | Unique key for value |

**Response**

```
No response in case of success
```

#### Delete All Items from cache

<br>

`DELETE` [http:localhost:6060/items]

**Parameters**

| Name | Required | Type | Description |
| ---: | :------: | :--: | ----------- |

**Response**

```
No response in case of success
```
