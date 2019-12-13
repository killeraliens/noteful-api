const FoldersService = {
  getAllFolders(knex) {
    return knex
      .select('*')
      .from('folders')
  },

  insertFolder(knex, postBody) {
    return knex
      .insert(postBody)
      .into('folders')
      .returning('*')
      .then(rows => rows[0])
  },

  getById(knex, id) {
    return knex
      .select('*')
      .from('folders')
      .where('id', id)
      .first()
  },

  updateFolder(knex, id, patchBody) {
    return knex
      .where('id', id)
      .from('folders')
      .update(patchBody)
  },

  deleteFolder(knex, id) {
    return knex
      .where('id', id)
      .from('folders')
      .delete()
  },

}

module.exports = FoldersService;
