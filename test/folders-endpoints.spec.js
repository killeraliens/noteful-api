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
            expect(res.body[0]).to.eql({...expected, id: 1})
          })
      })

    })
  })

  describe('POST /api/folders endpoint', () => {
    context('given that the post body is accurate', () => {
      const goodFolder = makeFolder.good()

      it('responds with 201 and newly created folder with id', () => {
        return supertest(app)
          .post('/api/folders')
          .send(goodFolder)
          .expect(201, { ...goodFolder, id: 1})
          .then(res => {
            return supertest(app)
              .get(`/api/folders/${res.body.id}`)
              .expect(200, res.body)
          })
      })
    })

    context('given missing field in post body', () => {
      const missingNameFolder = makeFolder.withMissingName()

      it('responds with 400 and error', () => {
        return supertest(app)
          .post('/api/folders')
          .send(missingNameFolder)
          .expect(400, {error: {message: `folder_name required in post body`}})
      })
    })

    context('given there is xss in the folder body', () => {
      it('responds with 201 and sanitized folder', () => {
        const folderWithXss = makeFolder.withXss()
        const expected = makeFolder.withSanitizedXss()
        return supertest(app)
          .post('/api/folders')
          .send(folderWithXss)
          .expect(201, {...expected, id: 1})
      })
    })
  })

  describe('GET /api/folders/:folder_id endpoint', () => {
    context('given that the folder exists', () => {
      const testFolders = makeFolders()

      beforeEach('insert folders into db', () => {
        return db
          .insert(testFolders)
          .into('folders')
      })

      it('responds with 200 and requested folder', () => {
        const goodId = testFolders[1].id
        return supertest(app)
          .get(`/api/folders/${goodId}`)
          .expect(200, testFolders[1])
      })
    })

    context('given that there are no folders', () => {
      it('responds with 404', () => {
        return supertest(app)
          .get('/api/folders/1')
          .expect(404, {error: {message: `Folder doesn't exist`}})
      })
    })
  })

  describe('PATCH /api/folders/:folder_id endpoint', () => {
    context('given that the folder exists', () => {
      const testFolders = makeFolders()
      const patchFolder = testFolders[1]
      const patchBody = { folder_name: 'updated name'}
      const badPatchBody = { not_name: 'updated name' }
      const patchedFolder = { ...patchFolder, folder_name: patchBody.folder_name}

      beforeEach('insert folders into db', () => {
        return db
          .insert(testFolders)
          .into('folders')
      })

      it('responds with 204 and updates folder', () => {
        return supertest(app)
          .patch(`/api/folders/${patchFolder.id}`)
          .send(patchBody)
          .expect(204)
          .then(numOfRowsAffected => {
            return supertest(app)
              .get(`/api/folders/${patchFolder.id}`)
              .expect(200, patchedFolder)
          })
      })

      it('responds with 400 and error with missing fields', () => {

        return supertest(app)
          .patch(`/api/folders/${patchFolder.id}`)
          .send(badPatchBody)
          .expect(400, { error: { message: `patch body must contain folder_name`}})
      })
    })

  })

  describe('DELETE /api/folders/:folder_id', () => {
    context('given the folder exists', () => {
      const testFolders = makeFolders()
      const deleteFolderId = testFolders[1].id
      const expectedFolders = testFolders.filter(folder => folder.id !== deleteFolderId)

      beforeEach('insert folders into db', () => {
        return db
          .insert(testFolders)
          .into('folders')
      })

      it('responds with 204 and removes folder from db', () => {
        return supertest(app)
          .delete(`/api/folders/${deleteFolderId}`)
          .expect(204)
          .then(() => {
            return supertest(app)
              .get(`/api/folders`)
              .expect(200, expectedFolders)
          })
      })
    })
  })

})
