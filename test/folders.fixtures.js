function makeFolders() {
  return [
    {
      id: 1,
      folder_name: 'chores',
    },
    {
      id: 2,
      folder_name: 'concerts',
    },
    {
      id: 3,
      folder_name: 'groceries',
    },
    {
      id: 4,
      folder_name: 'general',
    }
  ]
}

const makeFolder = {
  withXss() {
    return {
      id: 1,
      folder_name: `naughty <script>alert("xss");</script> Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
    }
  },

  withSanitizedXss() {
    return {
      id: 1,
      folder_name: `naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt; Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
    }
  }
}

module.exports = { makeFolders, makeFolder }
