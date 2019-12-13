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

foldersRouter
  .route('/:folder_id')
  .all(checkExists)
  .get(getFolder)
  .patch(bodyParser, patchFolder)
  .delete(deleteFolder)


function checkExists(req, res, next) {
  const knexI = req.app.get('db')
  const { folder_id } = req.params

  FoldersService
    .getById(knexI, folder_id)
    .then(folder => {
      if (!folder) {
        return res.status(404).json({ error: { message: `Folder doesn't exist` } })
      }
      res.folder = folder
      next()
    })
    .catch(next)
}

function getFolder(req, res, next) {
  res.json(sanitize(res.folder))
}

function patchFolder(req, res, next) {
  const knexI = req.app.get('db')
  const { folder_id } = req.params
  const { folder_name } = req.body
  const patchBody = { folder_name }

  const arrWithVals = Object.values(patchBody).filter(val => val)
  if(arrWithVals.length === 0) {
    res.status(400).json({error: {message: `patch body must contain folder_name`}})
  }

  FoldersService
    .updateFolder(knexI, folder_id, patchBody)
    .then(numOfRowsAffected => {
      res.status(204).end()
    })
}

function postFolder(req, res, next) {
  const knexI = req.app.get('db')
  const { folder_name } = req.body
  const postBody = { folder_name }

  for (const [key, value] of Object.entries(postBody)) {
    if(!value) {
      res.status(400).json({error: {message: `${key} required in post body`}})
    }
  }

  FoldersService
    .insertFolder(knexI, postBody)
    .then(folder => {
      res.status(201).json(sanitize(folder))
    })
    .catch(next)
}

function getFolders(req, res, next) {
  const knexI = req.app.get('db')

  FoldersService
    .getAllFolders(knexI)
    .then(folders => {
      const cleanFolders = folders.map(folder => sanitize(folder))
      res.json(cleanFolders)
    })
    .catch(next)
}

function deleteFolder(req, res, next) {
  const knexI = req.app.get('db')
  const { folder_id } = req.params

  FoldersService
    .deleteFolder(knexI, folder_id)
    .then(() => {
      res.status(204).end()
    })
    .catch(next)
}

module.exports = foldersRouter
