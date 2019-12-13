const NotesService = {
  getAllNotes(knex) {
    return knex
      .select('*')
      .from('notes')
  },

  insertNote(knex, postBody) {
    return knex
      .insert(postBody)
      .into('notes')
      .returning('*')
      .then(rows => rows[0])
  },

  getById(knex, id) {
    return knex
      .select('*')
      .from('notes')
      .where('id', id)
      .first()
  },

  updateNote(knex, id , patchBody) {
    return knex
      .where('id', id)
      .from('notes')
      .update(patchBody)
  },

  deleteNote(knex, id) {
    return knex
      .where('id', id)
      .from('notes')
      .delete()

  }
}

module.exports = NotesService;
