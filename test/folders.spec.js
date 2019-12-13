const knex = require('knex')
const app = require('../src/app')
const { makeFolders } = require('./folders.fixtures')

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

  describe('GET /folders endpoint', () => {

    context('given there is folders data', () => {
      const testFolders = makeFolders()

      beforeEach('insert folders data', () => {
        return db
          .insert(testFolders)
          .into('folders')
      })

      it('returns an array of all folders', () => {
        return supertest(app)
          .get('/folders')
          .expect(200, testFolders)
      })
    })
  })

})
