const express = require('express')
const app = express()
const port = 3000

const redis = require('redis')
const client = redis.createClient()

const bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

client.on('connect', function() {
    console.log('Redis client connected')
});

client.on('error', function (err) {
    console.log('Something went wrong ' + err)
});

// Initialize data for current session.
let data = {}
// Create prc qty hashes.
data.b = {}
data.s = {}
// Create sorted arrays of buys and sells.
data.b.v = []
data.s.v = []
client.set('data', JSON.stringify(data), redis.print)

/** @dev Get data stored in redis.
  * We do this aynchronously since we don't know how long the redis server will take to return.
  * @return promise for getting redis store data.
  */
function getStore() {

  return new Promise((resolve, reject) => {
    client.get('data', function (error, result) {
      if (error) {
          console.log(error);
          reject(error)
      }
      resolve(JSON.parse(result))
    });
  })
}

/** @dev Update data stored in redis.
  * @param new data object.
  * @return true.
  */
function updateStore(data) {

    client.set('data', JSON.stringify(data), redis.print)
    return true
}

/** @dev Call back function for generic and book routes.
  */
const getBook = function (req, res) {

  (async () => {

    data = await getStore()

    // Create formatted response
    let result = {}
    result.buys = []
    result.sells = []
    for (let i of data.b.v) {
      result.buys.unshift({"qty": data.b[i], "prc":i})
    }
    for (let i of data.s.v) {
      result.sells.unshift({"qty": data.s[i], "prc":i})
    }

    res.setHeader('Content-Type', 'application/json')
    res.send(JSON.stringify(result))
  })()
}

app.get('/', getBook)
app.get('/book', getBook)

/** @dev Buy routes and callbacks.
  */
app.get('/buy', (req, res) => res.send('No post data received'))
app.post('/buy', (req, res) => {

    // Make sure we have the data we need.
    if (typeof req.body.qty == undefined || typeof req.body.prc == undefined) {
      res.send('Post data in the form: { qty: 10, prc: 15 } is required')
    }
    // Make sure data is in the right format.
    qty = parseFloat(req.body.qty)
    prc = parseFloat(req.body.prc)
    if (typeof qty != 'number' || typeof prc != 'number' || qty <= 0 || prc <= 0) {
      res.send('Post data in the form: { qty: 10, prc: 15 } is required')
    }

    (async () => {

      // Get stored data.
      data = await getStore()

      // Update data based on post parameters.
      let newData = doBuy(data, qty, prc);

      // Save updated data.
      await updateStore(newData)

      res.send('Success!')
    })()
  }
)

/** @dev Sell routes and callbacks.
  */
app.get('/sell', (req, res) => res.send('No post data received'))
app.post('/sell', (req, res) => {

    // Make sure we have the data we need.
    if (typeof req.body.qty == undefined || typeof req.body.prc == undefined) {
      res.send('Post data in the form: { qty: 10, prc: 15 } is required')
    }
    // Make sure data is in the right format.
    qty = parseFloat(req.body.qty)
    prc = parseFloat(req.body.prc)
    if (typeof qty != 'number' || typeof prc != 'number' || qty <= 0 || prc <= 0) {
      res.send('Post data in the form: { qty: 10, prc: 15 } is required')
    }

    (async () => {

      // Get stored data.
      data = await getStore()

      // Update data based on post parameters.
      let newData = doSell(data, qty, prc);

      // Save updated data.
      await updateStore(newData)

      res.send('Success!')
    })()

  }
)

/** @dev  Transform data based on new sell parameters.
  * @param qty the number to sell.
  * @param prc the price at which to sell.
  * @return data the updated data object.
  */
function doSell(data, qty, prc) {

  // Loop until we've allocated our full quantity.
  while (qty > 0) {
    // Check if we have buy orders and we have a largest buy order larger than or equal this sell.
    let length = data.b.v.length
    if (length > 0 && data.b.v[length - 1] >= prc) {
      let buyMatch = data.b.v[length - 1]
      // Check if we've exhausted the highest buy order
      if(data.b[buyMatch] <= qty) {
        qty = qty - data.b[buyMatch]
        data.b[buyMatch] = 0
        // Remove from our sorted buy array
        data.b.v.pop()
      }
      // Otherwise the sell has been covered
      else {
        data.b[buyMatch] = data.b[buyMatch] - qty
        qty = 0
      }
    }
    // We dont have a buy order to match.
    else {
      // If we already have sell orders at this price we add this sell order on.
      if (data.s[prc] !== null && data.s[prc] > 0) {
        data.s[prc] = data.s[prc] + qty
        qty = 0
      }
      // Create a new sell and add to array of values.
      else {
        data.s[prc] = qty
        // Reverse for sorting
        data.s.v.reverse()
        // Add new item
        data.s.v.push(prc)
        // Sort, with function for correct numeric sort
        data.s.v.sort(function (a, b) {
          return a - b;
        })
        // Return to our desired orientation for performance.
        data.s.v.reverse()
        qty = 0
      }
    }
  }
  return data
}

/** @dev  Transform data based on new buy parameters.
  * @param qty  the number to buy.
  * @param prc the price at which to buy.
  * @return data the updated data object.
  */
function doBuy(data, qty, prc) {

  // Loop until we've allocated our full quantity.
  while (qty > 0) {
    // Check if we have sell orders and we have a smallest sell order smaller than or equal to this buy.
    let length = data.s.v.length
    if (length > 0 && data.s.v[length - 1] <= prc) {
      let sellMatch = data.s.v[length - 1]
      // Check if we've exhausted the smallest sell order
      if(data.s[sellMatch] <= qty) {
        qty = qty - data.s[sellMatch]
        data.s[sellMatch] = 0
        // Remove from our sorted sell array
        data.b.v.pop()
      }
      // Otherwise the buy has been covered
      else {
        data.s[sellMatch] = data.s[sellMatch] - qty
        qty = 0
      }
    }
    // We dont have a sell order to match.
    else {
      // If we already have buy orders at this price we add this buy order on.
      if (data.b[prc] !== null && data.b[prc] > 0) {
        data.b[prc] = data.b[prc] + qty
        qty = 0
      }
      // Create a new buy and add to array of values.
      else {
        data.b[prc] = qty
        // Add new item
        data.b.v.push(prc)
        // Sort, with function for correct numeric sort
        data.b.v.sort(function (a, b) {
          return a - b;
        })
        qty = 0
      }
    }
  }
  return data
}

const server = app.listen(port, () => console.log(`App listening on port ${port}!`))

module.exports = {
    server : server,
    app : app
}
