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



}

module.exports = FoldersService;
