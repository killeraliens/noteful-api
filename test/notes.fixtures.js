function makeNotes() {
  return [
    {
      id: 1,
      note_name: 'sweep patio',
      modified: '2018-01-13T01:57:25.748Z',
      content: 'watch for GLASS',
      folder_id: 1,
    },
    {
      id: 2,
      note_name: 'make bed',
      modified: '2017-01-13T01:57:25.748Z',
      content: 'cornerfolds',
      folder_id: 1,
    },
    {
      id: 3,
      note_name: 'carrots',
      modified: '2019-12-02T01:57:25.748Z',
      content: 'from good market',
      folder_id: 3,
    },
    {
      id: 4,
      note_name: 'celery',
      modified: '2019-10-12T01:57:25.748Z',
      content: 'organic',
      folder_id: 3,
    },
    {
      id: 5,
      note_name: 'ride bikesss',
      modified: '2019-12-13T01:57:25.748Z',
      content: 'get tires filled',
      folder_id: 4,
    },
    {
      id: 6,
      note_name: 'vomitory',
      modified: '2019-02-13T01:57:25.748Z',
      content: 'in norway',
      folder_id: 2,
    }
  ]
}

const makeNote = {
  good() {
    return {
      note_name: 'hyperdontia',
      content: 'in norway',
      folder_id: 2,
    }
  },
}

module.exports = { makeNotes, makeNote };
