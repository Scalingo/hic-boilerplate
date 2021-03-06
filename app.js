const express = require('express')
const Influx = require('influx')
const URL = require('url').URL

const port = process.env.PORT || 3000
const influxURL = new URL(process.env.INFLUX_URL || "influxdb://hic:hic@172.17.0.1:8086/test")

// Build the InfluxDB client based on the INFLUX_URL given in the process environment.
//
// The URL has the following form:
// influxdb://username:password@host:port/database_name
const influxClient = new Influx.InfluxDB({
  host: influxURL.hostname,
  port: influxURL.port,
  username: influxURL.username,
  password: influxURL.password,
  database: influxURL.pathname.substr(1), // pathname will contain: /database_name, we just want database_name, so remove the first char
})

const app = express()

app.post('/', (req, res) => {
  // Request should look like:
  // POST /?value=<number>

  // Parse the current value
  const value = parseFloat(req.query.value || "10")

  // Send it to InfluxDB
  influxClient.writePoints([
    {
      measurement: "hic_demo",
      tags: { source: "HTTP" },
      fields: { value: value },
    }
  ])
  res.send(`Value ${value} saved!`)
})

app.get('/', (req, res) => {
  // GET / will return a JSON array of all points recorded

  influxClient.query(`
    select * from hic_demo
  `).then(result => {
    res.json(result)
  }).catch(err => {
    res.status(500).send(err.stack)
  })
})

app.listen(port, () => console.log(`Listening on :${port}`))
