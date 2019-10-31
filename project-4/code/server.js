var path = require('path')
var express = require('express')
var bodyParser = require('body-parser')
var mysql = require('mysql')

/*
  Our settings - START
 */
var app = express() // 產生server (app)，但還沒執行
var port = 1234
var con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'store',
  port: 3306,
}) // 產生連結database的connection (con)，但還沒執行

/*
  Our settings - END
 */

function setStatic(app) {
  var root = path.join(__dirname, 'dist')
  var folders = ['/css', '/imgs', '/webfonts', '/js'] // 一定要有斜線
  folders.forEach(function(folder) {
    var dir = path.join(root, folder)
    app.use(folder, express.static(dir))
    // app.use('/css', express.static('/aa/bb/css'))
  })
}

function setTemplate(app) {
  var dir = path.join(__dirname, 'templates')
  app.set('views', dir)
  app.set('view engine', 'ejs')
}

function setBodyParser(app) {
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
}

function setAppConfig(app) {
  setStatic(app)
  setTemplate(app)
  setBodyParser(app)
}

function getColData(products) {
  // col = column, 將資料庫撈出來的資料分成4個column
  var cols = [[], [], [], []]
  for (var i = 0; i < products.length; i++) {
    var targetCol = i % cols.length
    cols[targetCol].push(products[i])
  }
  return cols
}

function renderMain(res, result, page, theme, promotion, search) {
  res.render('main', {
    cols: getColData(result),
    page: page,
    theme: theme || '',
    promotion: promotion || false,
    search: search || '',
  })
}

function renderMember(res) {
  res.render('member', {
    page: 'member',
    search: '',
  })
}

function setAppRoutes(app) {
  app.get('/', function(req, res) {
    var sql = 'SELECT * FROM `products` ORDER BY `price`'
    con.query(sql, function(err, result, fields) {
      if (err) throw err
      renderMain(res, result, 'index', '恣意享樂，盡在光速買！', true)
    })
  })

  app.get('/fashion', function(req, res) {
    var sql =
      "SELECT * FROM `products` WHERE `id` LIKE '%fash%' ORDER BY `price`"
    con.query(sql, function(err, result, fields) {
      if (err) throw err
      renderMain(res, result, 'fashion', '率性穿搭，任你揮灑！')
    })
  })

  app.get('/food', function(req, res) {
    var sql =
      "SELECT * FROM `products` WHERE `id` LIKE '%food%' ORDER BY `price`"
    con.query(sql, function(err, result, fields) {
      if (err) throw err
      renderMain(res, result, 'food', '大口咬下，就是爽快！')
    })
  })

  app.get('/search', function(req, res) {
    var search = req.query.q
    var conditions = []
    for (var i = 0; i < 4; i++) {
      conditions.push('%' + req.query.q + '%')
    }
    var sql = mysql.format(
      'SELECT * FROM `products` WHERE `title` LIKE ? OR `price` LIKE ? OR `id` LIKE ? OR `description` LIKE ? ORDER BY `price`',
      conditions,
    )
    con.query(sql, function(err, result, fields) {
      if (err) throw err
      renderMain(res, result, 'search', '', false, search)
    })
  })

  app.get('/member', function(req, res) {
    renderMember(res)
  })

  app.use(function(req, res) {
    // 使用者從瀏覽器網址打下任何不合法的route，告訴使用者網頁不存在。
    res.status(404).send('網頁不存在。')
  })
}

// 開始連結資料庫
con.connect(function(err) {
  if (err) throw err
  // 連結資料庫成功，接下來我們對server (app) 的組態進行設定
  setAppConfig(app)

  // 設定server (app) 可接受的route並且決定對應的reponse
  setAppRoutes(app)

  // 對server的設定都完成了，接著啟動server!
  app.listen(port, function() {
    console.log('Our app listening on port ' + port + '.')
  })
})
