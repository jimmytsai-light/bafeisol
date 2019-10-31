var path = require('path')
var express = require('express')
var bodyParser = require('body-parser')
var mysql = require('mysql')

var cookieParser = require('cookie-parser')
var crypto = require('crypto')
var uuidv4 = require('uuid/v4')

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

function setCookieParser(app) {
  app.use(cookieParser())
}

function setAuthCheck(app) {
  function authCheck(req, res, next) {
    req.user = null // 因為ejs不能接受undefined, 所以設為null

    var sid = req.cookies.sid
    if (sid) {
      var sql = mysql.format('SELECT * FROM `sessions` WHERE `sid` = ?', [sid])
      con.query(sql, function(err, result, fields) {
        if (err) throw err
        if (result.length !== 0) req.user = result[0]
        next()
      })
    } else {
      next()
    }
  }
  app.use(authCheck)
}

function getFeInitState(orders) {
  /* Fe = Front-end */
  var obj = {}
  orders.forEach(function(item) {
    obj[item.product_id] = {
      qty: item.qty,
      price: item.price,
    }
  })
  return { order: obj }
}

function getFeTotal(order, key1, key2) {
  var res = 0
  for (var id in order) {
    res += order[id][key1] * (key2 ? order[id][key2] : 1)
  }
  return res
}

function setAppConfig(app) {
  setStatic(app)
  setTemplate(app)
  setBodyParser(app)

  setCookieParser(app)

  setAuthCheck(app)
}

function queryOrder(req, res, next) {
  if (req.user) {
    var selectPart =
      'SELECT `orders`.`product_id`, `orders`.`qty`, `products`.`price`'
    var fromPart = 'FROM `orders`, `products`'
    var wherePart =
      'WHERE `orders`.`product_id` = `products`.`id` AND `orders`.`account` = ?'
    var sql = mysql.format([selectPart, fromPart, wherePart].join(' '), [
      req.user.account,
    ])
    con.query(sql, function(err, result, fields) {
      if (err) throw err
      req.user.initState = getFeInitState(result)
      req.user.totalQty = getFeTotal(req.user.initState.order, 'qty')
      req.user.totalPrice = getFeTotal(req.user.initState.order, 'qty', 'price')
      next()
    })
  } else {
    next()
  }
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

function renderMain(req, res, result, page, theme, promotion, search) {
  res.render('main', {
    cols: getColData(result),
    page: page,
    theme: theme || '',
    promotion: promotion || false,
    search: search || '',

    user: req.user || null,
  })
}

function renderMember(res, warning) {
  res.render('member', {
    page: 'member',
    search: '',

    user: null,
    warning: warning || '',
  })
}

function createSession(res, account) {
  var sid = uuidv4()
  var sql = mysql.format(
    'INSERT INTO `sessions` (`sid`, `account`) VALUES (?, ?)',
    [sid, account],
  )
  con.query(sql, function(err, result, fields) {
    if (err) throw err
    setResCookie(res, 'sid', sid)
    res.redirect('/')
  })
}

function deleteSession(req, res) {
  if (req.user) {
    var sid = req.user.sid
    var sql = mysql.format('DELETE FROM `sessions` WHERE `sid` = ?', [sid])
    con.query(sql, function(err, result, fields) {
      if (err) throw err
      setResCookie(res, 'sid', undefined, true)
      res.redirect('/')
    })
  } else {
    res.redirect('/')
  }
}

function generateHash(password) {
  var salt = crypto.randomBytes(32).toString('hex')
  var passhash = crypto
    .createHash('sha256')
    .update(password + salt)
    .digest('hex')
  return salt + '.' + passhash // 使用'.'來區別salt和passhash
  // 在資料庫中我們只使用一個`hash`欄位來存"salt.被hash過的密碼"就可以了
  // 你不需要另開一個欄位存salt
}

function compareHash(password, hash) {
  var array = hash.split('.')
  var salt = array[0]
  var passhash = array[1]
  return (
    passhash ===
    crypto
      .createHash('sha256')
      .update(password + salt)
      .digest('hex')
  )
}

function setResCookie(res, key, value, needToClear) {
  if (needToClear) {
    res.clearCookie(key)
  } else {
    var tenMins = 10 * 60 * 1000 // in milli-seconds
    res.cookie(key, value, { path: '/', maxAge: tenMins })
  }
}

function getSqlGetProducts(order) {
  var prefix = 'SELECT * FROM `products` WHERE `id` = '
  var suffix = ' ORDER BY `price`'
  var array = []
  for (key in order) {
    array.push("'" + key + "'")
  }
  if (array.length === 0) return ''
  var condition = array.join(' OR `id` = ')
  return prefix + condition + suffix
}

function renderCart(req, res, form, data, warning) {
  res.render('cart', {
    page: 'cart',
    search: '',
    form: form,
    cols: getColData(data),
    user: req.user || null,
    warning: warning || '',
  })
}

function getOrderId(account, productId) {
  return account + '-' + productId
}

function setAppRoutes(app) {
  app.get('/', queryOrder, function(req, res) {
    var sql = 'SELECT * FROM `products` ORDER BY `price`'
    con.query(sql, function(err, result, fields) {
      if (err) throw err
      renderMain(req, res, result, 'index', '恣意享樂，盡在光速買！', true)
    })
  })

  app.get('/fashion', queryOrder, function(req, res) {
    var sql =
      "SELECT * FROM `products` WHERE `id` LIKE '%fash%' ORDER BY `price`"
    con.query(sql, function(err, result, fields) {
      if (err) throw err
      renderMain(req, res, result, 'fashion', '率性穿搭，任你揮灑！')
    })
  })

  app.get('/food', queryOrder, function(req, res) {
    var sql =
      "SELECT * FROM `products` WHERE `id` LIKE '%food%' ORDER BY `price`"
    con.query(sql, function(err, result, fields) {
      if (err) throw err
      renderMain(req, res, result, 'food', '大口咬下，就是爽快！')
    })
  })

  app.get('/search', queryOrder, function(req, res) {
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
      renderMain(req, res, result, 'search', '', false, search)
    })
  })

  app.get('/member', function(req, res) {
    if (req.user) {
      // 在使用者有登入的情況下，要避免他看到member頁面
      res.redirect('/')
    } else {
      renderMember(res)
    }
  })

  app.get('/logout', deleteSession)

  app.post('/session', function(req, res) {
    var account = req.body.account
    var password = req.body.password
    var sql = mysql.format('SELECT * from `users` WHERE `account` = ?', [
      account,
    ])
    con.query(sql, function(err, result, fields) {
      if (err) throw err
      var targetUser = result[0]
      if (targetUser) {
        if (compareHash(password, targetUser.hash)) {
          createSession(res, account)
        } else {
          var warning = '密碼不正確'
          renderMember(res, warning)
        }
      } else {
        var warning = '帳號' + account + '不存在, 請先註冊' + account + '.'
        renderMember(res, warning)
      }
    })
  })

  app.post('/user', function(req, res) {
    var account = req.body.account
    var password = req.body.password
    var sql = mysql.format(
      'SELECT `account` from `users` WHERE `account` = ?',
      [account],
    )
    con.query(sql, function(err, result, fields) {
      if (err) throw err
      if (result.length === 0) {
        // 帳號沒有重複
        var hash = generateHash(password)
        var sqlCreateUser = mysql.format(
          'INSERT INTO `users` (`account`, `hash`) VALUES (?, ?)',
          [account, hash],
        )
        con.query(sqlCreateUser, function(err, result, fields) {
          if (err) throw err
          var sqlCreateOrder = mysql.format(
            'INSERT INTO `contacts` (`account`,`email`) VALUES (?, ?)',
            [account, account],
          )
          con.query(sqlCreateOrder, function(err, result, fields) {
            if (err) throw err
            createSession(res, account)
          })
        })
      } else {
        var warning = '帳號' + account + '已存在, 請使用別的email註冊.'
        renderMember(res, warning)
      }
    })
  })

  app.get('/cart', queryOrder, function(req, res) {
    if (req.user) {
      var sql = mysql.format('SELECT * FROM `contacts` WHERE `account` = ?', [
        req.user.account,
      ])
      var warning = req.query.warning
      con.query(sql, function(err, formResult, fields) {
        if (err) throw err
        var sqlGetProducts = getSqlGetProducts(req.user.initState.order)
        if (sqlGetProducts) {
          con.query(sqlGetProducts, function(err, dataResult, fields) {
            if (err) throw err
            renderCart(req, res, formResult[0], dataResult, warning)
          })
        } else {
          renderCart(req, res, formResult[0], [], warning)
        }
      })
    } else {
      // 在使用者沒有登入的情況下，要避免他看到cart頁面
      res.redirect('/')
    }
  })

  app.put('/order', function(req, res) {
    if (req.user) {
      var account = req.user.account
      var productId = req.body.productId
      var qty = req.body.qty
      var id = getOrderId(account, productId)
      var sql = mysql.format(
        'REPLACE INTO `orders` (`id`, `account`, `product_id`, `qty`) VALUES (?, ?, ?, ?)',
        [id, account, productId, qty],
      )
      if (qty === 0) {
        sql = mysql.format('DELETE FROM `orders` WHERE `id` = ?', [id])
      }
      con.query(sql, function(err, result, fields) {
        if (err) {
          res.status(500).send()
        } else {
          res.status(204).send()
        }
      })
    } else {
      res.status(401).send()
    }
  })

  app.put('/contact', function(req, res) {
    if (req.user) {
      var key = req.body.key
      var value = req.body.value
      var account = req.user.account
      var sql = mysql.format(
        'UPDATE `contacts` SET ?? = ? WHERE `account` = ?',
        [key, value, account],
      )
      con.query(sql, function(err, result, fields) {
        if (err) {
          res.status(500).send()
        } else {
          res.status(204).send()
        }
      })
    } else {
      res.status(401).send()
    }
  })

  app.post('/payment', function(req, res) {
    if (req.user) {
      var sql = mysql.format('DELETE FROM `orders` WHERE `account` = ?', [
        req.user.account,
      ])
      con.query(sql, function(err, result, fields) {
        if (err) {
          res.redirect('/cart?warning=伺服器異常，付款未成功，請稍後再試。')
        } else {
          res.redirect('/cart')
        }
      })
    } else {
      res.status(401).send()
    }
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
