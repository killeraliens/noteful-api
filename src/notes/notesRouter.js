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

function getNotes(req, res, next) {
  const db = req.app.get('db')
  NotesService
    .getAllNotes(db)
    .then(notes => {
      const sanitized = notes.map(note => sanitize(note))
      res.json(sanitized)
    })
}

module.exports = notesRouter;
