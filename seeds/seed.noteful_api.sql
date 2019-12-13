TRUNCATE folders, notes RESTART IDENTITY CASCADE;

INSERT INTO folders
  (folder_name)
    VALUES
      ('chores'),
      ('concerts'),
      ('groceries'),
      ('general');

INSERT INTO notes
  (note_name, modified, content, folder_id)
    VALUES
      ('sweep patio', '2019-01-13T01:57:25.748Z', 'watch for GLASS', 1),
      ('make bed', '2019-09-13T01:57:25.748Z', 'cornerfolds', 1),
      ('carrots', '2019-12-02T01:57:25.748Z', 'from good market', 3),
      ('celery', '2019-10-12T01:57:25.748Z', 'organic', 3),
      ('ride bikesss', '2019-12-13T01:57:25.748Z', 'get tires filled', 4),
      ('vomitory', '2019-02-13T01:57:25.748Z', 'in Norway', 2);

