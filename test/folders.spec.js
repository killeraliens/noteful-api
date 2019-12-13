const knex = require('knex')
const app = require('../src/app')
const { makeFolders, makeFolder } = require('./folders.fixtures')

describe('Folders endpoints', () => {
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

  describe('GET /api/folders endpoint', () => {

    context('given there is folders data', () => {
      const testFolders = makeFolders()

      beforeEach('insert folders data', () => {
        return db
          .insert(testFolders)
          .into('folders')
      })

      it('responds with 200 and an array of all folders', () => {
        return supertest(app)
          .get('/api/folders')
          .expect(200, testFolders)
      })
    })

    context('given that there is no folders data', () => {
      it('responds with 200 and an empty array', () => {
        return supertest(app)
          .get('/api/folders')
          .expect(200, [])
      })
    })

    context('given there is xss in the name field', () => {
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
            expect(res.body[0]).to.eql(expected)
          })
      })

    })
  })

})
