const knex = require('knex')
const app = require('../src/app')
const { makeFolders, makeFolder } = require('./folders.fixtures')
const { makeNotes, makeNote } = require('./notes.fixtures')

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

    context.skip('given that there is no folders data', () => {
      it('responds with 200 and an empty array', () => {
        return supertest(app)
          .get('/api/folders')
          .expect(200, [])
      })
    })

    context.skip('given there is xss in the name field', () => {
      const folderWithXss = makeFolder.withXss()
      const expected = makeFolder.withSanitizedXss()

      beforeEach('insert a folder with xss', () => {
        return db
          .insert([folderWithXss])
          .into('folders')
      })

      it('responds with 200 and sanitized folders', () => {
        return supertest(app)
          .get('/api/folders')
          .expect(200)
          .expect(res => {
            expect(res.body[0]).to.eql({ ...expected, id: 1 })
          })
      })

    })
  })
})
