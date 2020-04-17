const express = require('express')
const http = require('http')
const path = require('path')

const app = express()
const server = http.createServer(app)

const publicDirPath = path.join(__dirname, '../public')
app.use(express.static(publicDirPath))

module.exports = server