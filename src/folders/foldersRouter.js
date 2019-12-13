const express = require('express')
const FoldersService = require('./folders-service.js')
const foldersRouter = express.Router()
const bodyParser = express.json()
const xss = require('xss')
const sanitize = folder => {
  return {
    id: folder.id,
    folder_name: xss(folder.folder_name)
  }
}

foldersRouter
  .route('/')
  .get(getFolders)
  .post(bodyParser, postFolder)


function postFolder(req, res, next) {
  const knexI = req.app.get('db')
  const { folder_name } = req.body
  const postBody = { folder_name }

  for (const [key, value] of Object.entries(postBody)) {
    if(!value) {
      res.status(400).json({error: {message: `${key} required`}})
    }
  }

  FoldersService
    .insertFolder(knexI, postBody)
    .then(folder => {
      res.status(201).json(sanitize(folder))
    })
}

function getFolders(req, res, next) {
  const knexI = req.app.get('db')

  FoldersService
    .getAllFolders(knexI)
    .then(folders => {
      const cleanFolders = folders.map(folder => sanitize(folder))
      res.json(cleanFolders)
    })
}

module.exports = foldersRouter
