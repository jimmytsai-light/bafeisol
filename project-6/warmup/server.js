var express = require('express')
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser')
var session = require('express-session')

// invoke an instance of express application.
var app = express()

// set our application port
var port = 1234

// initialize body-parser to parse incoming parameters requests to req.body
app.use(bodyParser.urlencoded({ extended: true }))

// initialize cookie-parser to allow us access the cookies stored in the browser.
app.use(cookieParser('somerandonstuffs'))

// initialize express-session to allow us track the logged-in user across sessions.
app.use(
  session({
    secret: 'somerandonstuffs',
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 600000,
    },
  }),
)

app.get('/', function(req, res) {
  res.send('歡迎光臨，您尚未登入！！')
})

app.listen(port, function() {
  console.log('Our warmup example listening on port ' + port + '.')
})
