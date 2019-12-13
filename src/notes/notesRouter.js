const express = require('express')
const NotesService = require('./notes-service')
const notesRouter = express.Router()
const bodyParser = express.json()
const xss = require('xss')
const sanitize = note => {
  return {
    id: note.id,
    note_name: xss(note.note_name),
    modified: note.modified,
    content: xss(note.content),
    folder_id: note.folder_id
  }
}

notesRouter
  .route('/')
  .get(getNotes)
  .post(bodyParser, postNote)

notesRouter
  .route('/:note_id')
  .all(checkExists)
  .get(getNote)
  .patch(bodyParser, patchNote)
  .delete(deleteNote)

function checkExists(req, res, next) {
  const knexI = req.app.get('db')
  const { note_id } = req.params

  NotesService
    .getById(knexI, note_id)
    .then(note => {
      if (!note) {
        return res.status(404).json({ error: { message: `Note doesn't exist` } })
      }
      res.note = note
      next()
    })
    .catch(next)
}

function getNotes(req, res, next) {
  const db = req.app.get('db')
  NotesService
    .getAllNotes(db)
    .then(notes => {
      const sanitized = notes.map(note => sanitize(note))
      res.json(sanitized)
    })
    .catch(next)
}

function getNote(req, res, next) {
  res.json(sanitize(res.note))
}

function postNote(req, res, next) {
  const knexI = req.app.get('db')
  const { note_name, content, folder_id } = req.body
  const postBody = { note_name, folder_id }

  for (const [key, value] of Object.entries(postBody)) {
    if (!value) {
      res.status(400).json({ error: { message: `${key} required in post body` } })
    }
  }

  postBody.content = content

  NotesService
    .insertNote(knexI, postBody)
    .then(note => {
      res.status(201).json(sanitize(note))
    })
    .catch(next)
}

function patchNote(req, res, next) {
  const knexI = req.app.get('db')
  const { note_id } = req.params
  const { note_name, content, folder_id } = req.body
  const patchBody = { note_name, content, folder_id }

  const arrWithVals = Object.values(patchBody).filter(val => val)
  if (arrWithVals.length === 0) {
    res.status(400).json({ error: { message: `patch body must contain at least one required field` } })
  }

  NotesService
    .updateNote(knexI, note_id, patchBody)
    .then(numOfRowsAffected => {
      res.status(204).end()
    })
    .catch(next)

}

function deleteNote(req, res, next) {
  const knexI = req.app.get('db')
  const { note_id } = req.params

  NotesService
    .deleteNote(knexI, note_id)
    .then(numOfRowsAffected => {
      res.status(204).end()
    })
    .catch(next)
}


module.exports = notesRouter;
