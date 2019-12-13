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
