require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const helmet = require('helmet')
const cors = require('cors')
const { NODE_ENV } = require('./config')

const app = express()
const morganOption = NODE_ENV === 'production' ? 'tiny' : 'dev'
const foldersRouter = require('./folders/foldersRouter')
const notesRouter = require('./notes/notesRouter')

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())
app.get('/', (req, res) => {
  res.send('Hello boilerplate')
})
app.use('/api/folders', foldersRouter)
app.use('/api/notes', notesRouter)
app.use(function errorHandler(error, req, res, next) {
  let response
  if (NODE_ENV === "production") {
    response = { error: {message: "Server Error"} }
  } else {
    console.log(error)
    response = { message: error.message, error }
  }
  res.status(500).json(response)
})

module.exports = app
