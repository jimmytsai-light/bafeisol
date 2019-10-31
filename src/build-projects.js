var path = require('path')
var fs = require('fs')
var ejs = require('ejs')
var shell = require('shelljs')
var errorPrefix = '[ERROR]'
var successPrefix = '[SUCCESS]'
// User input - START
var args = process.argv.slice(2)
var codeFolder = 'code'
var distFolder = 'dist'
var commonRootFolder2or3 = '../../common'
var commonRootFolder4or5or6 = '../' + commonRootFolder2or3
var commonStaticFolders = ['css', 'imgs', 'webfonts']
var commonMap = {
  2: { src: commonRootFolder2or3, dst: codeFolder},
  3: { src: commonRootFolder2or3, dst: codeFolder},
  4: { src: commonRootFolder4or5or6, dst: path.join(codeFolder, distFolder)},
  5: { src: commonRootFolder4or5or6, dst: path.join(codeFolder, distFolder)},
  6: { src: commonRootFolder4or5or6, dst: path.join(codeFolder, distFolder)},
}
var csvRootDir = path.join(__dirname, '..', 'database')
var outputRootDir = path.join(__dirname, '../')
var inputRootDir = path.join(__dirname, 'input')
var tplFolder = 'templates' // tpl = templates
var parFolder = 'partials' // par = partials
var jsFolder = 'js'
var startPrj = 2 // Naming convention: prj = project
var endPrj = 6
/* All source files - START */
var allInputFilenames = getFilenames(inputRootDir, 'js')
var allTplFilenames = getFilenames(
  path.join(inputRootDir, tplFolder),
  'ejs',
)
var allParFilenames = getFilenames(
  path.join(inputRootDir, tplFolder, parFolder),
  'ejs',
)
var allJsFilenames = getFilenames(
  path.join(inputRootDir, distFolder, jsFolder),
  'js',
)
/* All source files - END */
function getColData(products) {
  // col = column, 將資料庫撈出來的資料分成4個column
  var cols = [[], [], [], []]
  for (var i = 0; i < products.length; i++) {
    var targetCol = i % cols.length
    cols[targetCol].push(products[i])
  }
  return cols
}

function getFeTotal(order, key1, key2) {
  var res = 0
  for (var id in order) {
    res += order[id][key1] * (key2 ? order[id][key2] : 1) 
  }
  return res
}

function search(products, s) {
  return products.filter(function(product) {
    if (
      product.title.includes(s) ||
      String(product.price).includes(s) ||
      product.id.includes(s) ||
      product.description.includes(s)
    ) {
      return true
    }
    return false
  })
}

function trimSingleQuotes(s) {
  return s.replace(/'/g, '')
}

function getCsvData(filename) {
  var filePath = path.join(csvRootDir, filename)
  var lines = String(fs.readFileSync(filePath)).split('\n')
  if (lines.length <= 1) {
    return []
  } else {
    var res = []
    var fields = lines[0].split(',')
    for (var i = 1; i < lines.length; i++) {
      var data = {}
      var cols = lines[i].split(',').map(trimSingleQuotes)
      fields.forEach(function(field, index) {
        data[field] = cols[index]
      })
      res.push(data)
    }
    return res
  }
}

function getValueMap(rows, key) {
  var res = {}
  rows.forEach(function(row) {
    res[row[key]] = true
  })
  return res
}

function genToInt(keyMap) {
  return function(data) {
    for (var key in data) {
      if (keyMap[key]) {
        data[key] = parseInt(data[key])
      }
    }
    return data
  }
}

function getCsvContact() {
  return getCsvData('rawdata_contacts.csv')[0]
}

function getCsvOrders() {
  var orders = getCsvData('rawdata_orders.csv')
  var toInt = genToInt({ qty: true })
  return orders.map(toInt)
}

function getCsvProducts() {
  var products = getCsvData('rawdata_products.csv')
  var toInt = genToInt({ price: true })
  return products.map(toInt)
}

function getCsvOrderProducts(products) {
  var orders = getCsvOrders()
  var valueMap = getValueMap(orders, 'product_id')
  return products.filter(function(product) {
    return valueMap[product.id]
  })
}

function getCsvUser(products) {
  var results = getCsvOrders()
  var account = getCsvData('rawdata_users.csv')[0].account
  var order = {}
  results.forEach(function(item) {
    order[item.product_id] = {
      qty: item.qty,
    }
  })
  products.forEach(function(item) {
    if (order[item.id]) {
      order[item.id].price = item.price
    }
  })
  var user = {
    account: account,
    initState: { order: order},
  }
  user.totalQty = getFeTotal(user.initState.order, 'qty')
  user.totalPrice = getFeTotal(user.initState.order, 'qty', 'price')
  return user
}

function getPrjSettingOf2or3(prj) {
  var delimiters = ['%', '$']
  var products = getCsvProducts()
  var cols = getColData(products)
  var user = getCsvUser(products)
  var commonData = { prj: prj }
  var contactForm = getCsvContact()
  if (prj === 2) {
    var pages = ['index', 'fashion', 'food', 'search']
    var fileSrcs = []
    pages.forEach(function(page) {
      fileSrcs.push({
        page: page,
        filename: page + '.html',
      })
      fileSrcs.push({
        page: page,
        filename: page + '-loggedin.html',
      })
    })
    var itemsFromMain = fileSrcs.map(function(fileSrc) {
      var dataSrcs = []
      var tmp = {
        cols: cols,
        page: fileSrc.page,
        theme: '',
        promotion: false,
        search: '',
        user: null,
      }
      if (fileSrc.filename.includes('loggedin')) {
        tmp.user = user
      }
      if (fileSrc.filename.includes('index')) {
        tmp.theme = '恣意享樂，盡在光速買！'
        tmp.promotion = true
      } else if (fileSrc.filename.includes('fashion')) {
        tmp.theme = '率性穿搭，任你揮灑！'
        tmp.cols = getColData(search(products, 'fash'))
      } else if (fileSrc.filename.includes('food')) {
        tmp.theme = '大口咬下，就是爽快！'
        tmp.cols = getColData(search(products, 'food'))
      } else if (fileSrc.filename.includes('search')) {
        tmp.search = '酥脆'
        tmp.cols = getColData(search(products, tmp.search))
      }
      dataSrcs.push(tmp)
      dataSrcs.push(commonData)
      return {
        inputName: 'main.ejs',
        delimiters: delimiters,
        dataSrcs: dataSrcs,
        outputName: fileSrc.filename,
      }
    })
    return {
      code: {
        inputFolder: 'templates',
        items: itemsFromMain.concat([
          {
            inputName: 'cart.ejs',
            delimiters: delimiters,
            dataSrcs: [
              {
                page: 'cart',
                search: '',
                form: contactForm,
                cols: getColData(getCsvOrderProducts(products)),
                user: user,
                warning: '',
              },
              commonData,
            ],
            outputName: 'cart-loggedin.html',
          },
          {
            inputName: 'member.ejs',
            delimiters: delimiters,
            dataSrcs: [
              {
                page: 'member',
                search: '',
                user: null,
                warning: '',
              },
              commonData,
            ],
            outputName: 'member.html',
          },
        ]),
      },
      'code/js': {
        inputFolder: 'dist/js',
        items: ['nav.js'].map(function(filename) {
          return {
            inputName: filename,
            delimiters: ['$'],
            dataSrcs: [commonData],
            outputName: filename,
          }
        }),
      },
    }
  } else if (prj === 3) {
    return {
      code: {
        inputFolder: 'templates',
        items: [
          {
            inputName: 'cart.ejs',
            delimiters: delimiters,
            dataSrcs: [
              {
                page: 'cart',
                search: '',
                form: contactForm,
                cols: getColData(getCsvOrderProducts(products)),
                user: user,
                warning: '',
              },
              commonData,
            ],
            outputName: 'cart-loggedin.html',
          },
          {
            inputName: 'member.ejs',
            delimiters: delimiters,
            dataSrcs: [
              {
                page: 'member',
                search: '',
                user: null,
                warning: '',
              },
              commonData,
            ],
            outputName: 'member.html',
          },
        ],
      },
      'code/js': {
        inputFolder: 'dist/js',
        items: filterFile(allJsFilenames, ['request.js']).map(function(filename) {
          return {
            inputName: filename,
            delimiters: ['$'],
            dataSrcs: [commonData],
            outputName: filename,
          }
        }),
      },
    }
  }
}

function getPrjSettingOf4or5or6(prj) {
  function getPrj4or5or6Items(prj, filenames) {
    var delimiters = ['$']
    var dataSrcs = [{ prj: prj }]
    return filenames.map(function(filename) {
      return {
        inputName: filename,
        delimiters: delimiters,
        dataSrcs: dataSrcs,
        outputName: filename,
      }
    })
  }
  var finalInputFilenames = allInputFilenames
  var finalTplFilenames = allTplFilenames
  var finalParFilenames = allParFilenames
  var finalJsFilenames = allJsFilenames
  if (prj === 4) {
    finalTplFilenames = filterFile(allTplFilenames, ['cart.ejs'])
    finalParFilenames = filterFile(allParFilenames, ['script.ejs', 'warning-script.ejs'])
    finalJsFilenames = ['nav.js', 'member.js']
  }
  return {
    code: {
      inputFolder: '', // '' means inputRootDir
      items: getPrj4or5or6Items(prj, finalInputFilenames),
    },
    'code/templates': {
      inputFolder: 'templates', // 'templates' means ${inputRootDir}/templates
      items: getPrj4or5or6Items(prj, finalTplFilenames),
    },
    'code/templates/partials': {
      inputFolder: 'templates/partials',
      items: getPrj4or5or6Items(prj, finalParFilenames)
    },
    'code/dist/js': {
      inputFolder: 'dist/js',
      items: getPrj4or5or6Items(prj, finalJsFilenames)
    },
  }
}
// User input - END

function getFilenames(dir, ext) {
  var suffix = '.' + ext
  return fs.readdirSync(dir).filter(function(item) {
    return item.endsWith(suffix)
  })
}

function filterFile(filenames, passList) {
  return filenames.filter(
    function(item) { return !passList.includes(item) }
  )
}

function genCommonLinks(prj) {
  var src = commonMap[prj].src
  var dst = commonMap[prj].dst
  commonStaticFolders.forEach(function(folder) {
    shell.ln('-sf', path.join(src, folder), folder)
    fs.renameSync(folder, path.join('../', prjFolder(prj), dst, folder))
  })
}

function getIntArray(start, end) {
  var res = []
  for (var i = start; i <= end; i++) {
    res.push(i)
  }
  return res
}

function getValidPrjs(args, allPrjs) {
  var startPrj = allPrjs[0]
  var endPrj = allPrjs[allPrjs.length - 1]
  var prjs = []
  if (args.length === 0) {
    prjs = allPrjs
  } else {
    var done = {}
    args.forEach(function(item) {
      var prj = parseInt(item)
      if (prj && prj >= startPrj && prj <= endPrj && !done[prj]) {
        prjs.push(prj)
        done[prj] = true
      }
    })
  }
  return prjs
}

function showInvalidArgsMsg(startPrj, endPrj) {
  var msg = [
    errorPrefix,
    'The project numbers you input are all invalid.',
    'The valid number must be >=',
    startPrj,
    'and',
    '<=',
    endPrj,
  ].join(' ')
  console.log(msg)
}

function showBuildStartMsg(prjs) {
  console.log(
    [
      '===',
      'Build projects',
      prjs.join(', '),
      'starts',
      '===',
    ]
    .join(' ')
  )
}

function showBuildEndMsg(prjs) {
  console.log(
    [
      '\n===',
      'Build projects',
      prjs.join(', '),
      'success!',
      '===',
    ]
    .join(' ')
  )
}

function prjFolder(prj) {
  return 'project-' + String(prj)
}

function getConfigs(prj) {
  var configs = []
  var prjSetting = {}
  if ([2, 3].includes(prj)) {
    prjSetting = getPrjSettingOf2or3(prj)
  } else if ([4, 5, 6].includes(prj)) {
    prjSetting = getPrjSettingOf4or5or6(prj)
  }
  for (var outputFolder in prjSetting) {
    var items = prjSetting[outputFolder].items
    var inputDir = path.join(inputRootDir, prjSetting[outputFolder].inputFolder || '')
    var outputDir = path.join(outputRootDir, prjFolder(prj), outputFolder)
    shell.mkdir('-p', [outputDir])
    items.forEach(function(item) {
      configs.push({
        inputPath: path.join(inputDir, item.inputName),
        delimiters: item.delimiters,
        dataSrcs: item.dataSrcs,
        outputPath: path.join(outputDir, item.outputName),
      })
    })
  }
  return configs
}

function buildPrj(prj) {
  showPrjStart(prj)
  var configs = getConfigs(prj)
  // console.log(configs)
  configs.forEach(function(config) {
    // console.log('config.dataSrcs =', config.dataSrcs)
    var tmp = ''
    config.delimiters.forEach(function(delimiter, index) {
      var data = config.dataSrcs[index]
      var option = { delimiter: delimiter }
      if (index === 0) {
        ejs.renderFile(
          config.inputPath, data, option, function(err, str) { tmp = str },
        )
      } else {
        tmp = ejs.render(tmp, data, option)
      }
      if (index === (config.delimiters.length - 1)) {
        if (
          config.outputPath.endsWith('.ejs') ||
          config.outputPath.endsWith('.html')
        ) {
          tmp = tmp.replace(/^\s*\n/gm, '') // 去空白行
        }
        if (config.outputPath.endsWith('.ejs')) {
          tmp = tmp.replace(/\s*$/gm, '') // 去行尾空格或tab
        }
        fs.writeFileSync(config.outputPath, tmp)
      }
    })
  })
  genCommonLinks(prj)
  showPrjEnd(prj)
}

function showPrjStart(prj) {
  console.log('\n# Build project-' + String(prj) + ' starts!')
}

function showPrjEnd(prj) {
  console.log('# Build project-' + String(prj) + ' success!')
}

function main(args) {
  var allPrjs = getIntArray(startPrj, endPrj)
  var prjs = getValidPrjs(args, allPrjs)

  if (prjs.length === 0) {
    showInvalidArgsMsg(allPrjs[0], allPrjs[allPrjs.length - 1])
    return
  }
  showBuildStartMsg(prjs)

  prjs.forEach(function(prj) {
    buildPrj(prj)
  })

  showBuildEndMsg(prjs)
}

main(args)
