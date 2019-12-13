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
})
