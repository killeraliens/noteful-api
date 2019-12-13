const knex = require('knex')
const app = require('../src/app')
const { makeFolders, makeFolder } = require('./folders.fixtures')
const { makeNotes, makeNote } = require('./notes.fixtures')

function roundToHour(date) {
  p = 60 * 60 * 1000; // milliseconds in an hour
  return new Date(Math.round(date.getTime() / p) * p);
}

describe('Notess endpoints', () => {
  let db;

  before('create knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    })
    app.set('db', db)
  })

  before('truncate folders, notes tables', () => {
    return db.raw('TRUNCATE notes, folders RESTART IDENTITY CASCADE')
  })

  beforeEach('truncate folders, notes tables', () => {
    return db.raw('TRUNCATE notes, folders RESTART IDENTITY CASCADE')
  })

  afterEach('truncate folders, notes tables', () => {
    return db.raw('TRUNCATE notes, folders RESTART IDENTITY CASCADE')
  })

  after('kill knex instance', () => {
    return db.destroy()
  })

  describe('GET /api/notes endpoint', () => {

    context('given there is notes and folders data', () => {
      const testFolders = makeFolders()
      const testNotes = makeNotes()

      beforeEach('insert folders then notes data', () => {
        return db
          .insert(testFolders)
          .into('folders')
          .then(() => {
            return db
              .insert(testNotes)
              .into('notes')
          })
      })

      it('responds with 200 and an array of all notes', () => {
        return supertest(app)
          .get('/api/notes')
          .expect(200, testNotes)
      })
    })

    context('given that there is no notes data', () => {
      it('responds with 200 and an empty array', () => {
        return supertest(app)
          .get('/api/notes')
          .expect(200, [])
      })
    })

    context('given there is xss in the name field', () => {
      const noteWithXss = makeNote.withXss()
      const expected = makeNote.withSanitizedXss()
      const testFolders = makeFolders()

      beforeEach('insert a folder with xss', () => {
        return db
          .insert(testFolders)
          .into('folders')
          .then(() => {
            return db
              .insert([noteWithXss])
              .into('notes')
          })
      })

      it('responds with 200 and sanitized folders', function() {
        this.retries(3)
        return supertest(app)
          .get('/api/notes')
          .expect(200)
          .expect(res => {
            expect(res.body[0]).to.have.property('modified')
            expect(res.body[0]).to.have.property('id')
            const expectedDate = roundToHour(new Date(new Date().getTime()))
            const actualDate = roundToHour(new Date(res.body[0].modified))
            expect(actualDate).to.eql(expectedDate)
            expect(res.body[0]).to.eql({
              ...expected,
              id: 1,
              modified: res.body[0].modified
            })
          })
      })

    })
  })

  describe('GET /api/notes/:note_id endpoint', () => {
    context('given that the note exists', () => {
      const testFolders = makeFolders()
      const testNotes = makeNotes()

      beforeEach('insert folders and notes into db', () => {
        return db
          .insert(testFolders)
          .into('folders')
          .then(() => {
            return db
              .insert(testNotes)
              .into('notes')
          })
      })

      it('responds with 200 and requested note', () => {
        const goodId = testNotes[1].id

        return supertest(app)
          .get(`/api/notes/${goodId}`)
          .expect(200, testNotes[1])
      })
    })

    context('given that there are no notes', () => {
      const testFolders = makeFolders()

      beforeEach('insert folders only into db', () => {
        return db
          .insert(testFolders)
          .into('folders')
      })

      it('responds with 404', () => {
        return supertest(app)
          .get('/api/notes/1')
          .expect(404, { error: { message: `Note doesn't exist` } })
      })
    })
  })

  describe('POST /api/notes endpoint', () => {
    const testFolders = makeFolders()

    beforeEach('insert folders to reference', () => {
      return db
        .insert(testFolders)
        .into('folders')
    })

    context('given that the post body is accurate', () => {

      it('responds with 201 and newly created note with id', () => {
        const goodNote = makeNote.good()

        return supertest(app)
          .post('/api/notes')
          .send(goodNote)
          .expect(201)
          .expect(res => {
            const expectedDate = new Date(new Date().getTime()).toLocaleString()
            const actualDate = new Date(res.body.modified).toLocaleString()
            expect(actualDate).to.eql(expectedDate)
            expect(res.body).to.eql({
              ...goodNote,
              id: 1,
              modified: res.body.modified
            })
          })
          .then(res => {
            return supertest(app)
              .get(`/api/notes/${res.body.id}`)
              .expect(200, res.body)
          })
      })
    })

    context('given missing field in post body', () => {
      //const missingNameFolder = makeFolder.withMissingName()
      //const testNotes = makeNotes
      const note = makeNote.good()
      const requiredFields = ['folder_id', 'note_name']
      requiredFields.forEach(field => {
        it('responds with 400 and error', () => {
          delete note[field]
          return supertest(app)
            .post('/api/notes')
            .send(note)
            .expect(400, { error: { message: `${field} required in post body` } })
        })
      })
    })

    context('given there is xss in the notes body', () => {
      it('responds with 201 and sanitized folder', () => {
        const noteWithXss = makeNote.withXss()
        const expected = makeNote.withSanitizedXss()
        return supertest(app)
          .post('/api/notes')
          .send(noteWithXss)
          .expect(201)
          .expect(res => {
            const expectedDate = new Date(new Date().getTime()).toLocaleString()
            const actualDate = new Date(res.body.modified).toLocaleString()
            expect(actualDate).to.eql(expectedDate)
            expect(res.body).to.eql({
              ...expected,
              id: 1,
              modified: res.body.modified
            })
          })
            .then(res => {
              return supertest(app)
                .get(`/api/notes/${res.body.id}`)
                .expect(200, res.body)
            })
      })
    })
  })

  describe('PATCH /api/notes/:note_id', () => {

    context('given note does not exist', () => {
      const badId = 12345
      it('returns 404', () => {
        return supertest(app)
          .patch(`/api/notes/${badId}`)
          .expect(404, { error: { message: `Note doesn't exist` } })
      })
    })

    context('given the note exists', () => {
      const testFolders = makeFolders()
      const testNotes = makeNotes()

      beforeEach('insert folders and notes into db', () => {
        return db
          .insert(testFolders)
          .into('folders')
          .then(() => {
            return db
              .insert(testNotes)
              .into('notes')
          })
      })

      it('responds with 204', () => {
        const idToPatch = testNotes[0].id
        const patchBody = {
          note_name: 'A new title',
          folder_id: 1,
          content: 'New content updated..'
        }
        const noteBefore = testNotes[0]
        const expectedNote = { ...noteBefore, ...patchBody }

        return supertest(app)
          .patch(`/api/notes/${idToPatch}`)
          .send(patchBody)
          .expect(204)
          .then(() => {
            return supertest(app)
              .get(`/api/notes/${idToPatch}`)
              .expect(200)
              .expect(res => {
                expect(res.body).to.eql(expectedNote)
              })
          })
      })

      // it('responds with 400 when no required fields supplied', () => {
      //   const idToPatch = articlesArray[0].id
      //   const badPatchBody = {
      //     badField: 'do not accept'
      //   }

      //   return supertest(app)
      //     .patch(`/api/articles/${idToPatch}`)
      //     .send(badPatchBody)
      //     .expect(400, { error: { message: `Body must contain at least one of title, content, style` } })
      // })

      // it('responds with 204 when updating required fields and ignoring unexpected fields', () => {
      //   const idToPatch = articlesArray[1].id
      //   const badPatchBody = {
      //     title: `I'm supposed to be updated`,
      //     badField: 'bad field to ignore'
      //   }
      //   const articleBefore = articlesArray.find(article => article.id == idToPatch)
      //   const expectedArticle = {
      //     ...articleBefore,
      //     title: badPatchBody.title
      //   }

      //   return supertest(app)
      //     .patch(`/api/articles/${idToPatch}`)
      //     .send(badPatchBody)
      //     .expect(204)
      //     .then(() => {
      //       return supertest(app)
      //         .get(`/api/articles/${idToPatch}`)
      //         .expect(expectedArticle)
      //     })
      // })
    })
  })

  describe('DELETE /api/notes/:note_id endpoint', () => {

    context('given that the note exists', () => {
      const testFolders = makeFolders()
      const testNotes = makeNotes()

      beforeEach('insert folders and notes into db', () => {
        return db
        .insert(testFolders)
        .into('folders')
        .then(() => {
          return db
          .insert(testNotes)
          .into('notes')
        })
      })

      it('responds with 204 and removes the note', () => {
        const deleted = testNotes[1]
        const expectedNotes = testNotes.filter(note => note.id !== deleted.id)
        return supertest(app)
          .delete(`/api/notes/${deleted.id}`)
          .expect(204)
          .then(res => {
            return supertest(app)
              .get(`/api/notes`)
              .then(res => {
                expect(res.body).to.eql(expectedNotes)
              })
          })
      })
    })
  })

})
