
function initQtyActionDoms() {
  /* actionDom is plusDom or minusDom */
  var plusDoms = document.querySelectorAll('[js-dom="plus"]')
  var minusDoms = document.querySelectorAll('[js-dom="minus"]')
  var navTotalQtyDom = document.querySelector('[js-dom="nav-total-qty"]')
  var mainTotalQtyDom = document.querySelector('[js-dom="main-total-qty"]')
  var totalPriceDom = document.querySelector('[js-dom="total-price"]')

  var timeout = undefined

  for (var i = 0; i < plusDoms.length; i++) {
    addListenerForPlusDoms(plusDoms[i])
    addListenerForMinusDoms(minusDoms[i])
  }

  function addListenerForPlusDoms(plusDom) {
    plusDom.addEventListener('click', function(e) {
      var data = getQtyActionData(plusDom)
      if (canPlus(data.id)) {
        updateStateForPlus(data.id, data.price)
        commonFlow(data)
      }
    })
  }

  function addListenerForMinusDoms(minusDom) {
    minusDom.addEventListener('click', function(e) {
      var data = getQtyActionData(minusDom)
      if (canMinus(data.id)) {
        updateStateForMinus(data.id, data.price)
        commonFlow(data)
      }
    })
  }

  function getQtyActionData(actionDom) {
    /* actionDom is plusDom or minusDom */
    var productDom = actionDom.closest('[js-dom="product"]')
    var qtyDom = productDom.querySelector('[js-dom="qty"]')
    var priceDom = productDom.querySelector('[js-dom="price"]')
    var idDom = productDom.querySelector('[js-dom="id"]')
    var price = parseInt(priceDom.textContent.replace('NT$', '').trim())
    var id = idDom.textContent.trim()
    return {
      id: id,
      price: price,
      qtyDom: qtyDom,
    }
  }

  function canPlus(id) {
    if (!state.order[id]) return true // 還沒被訂購
    if (state.order[id].qty < 10) return true // 訂購數量小於10
    return false
  }

  function updateStateForPlus(id, price) {
    if (state.order[id]) {
      state.order[id].qty += 1
    } else {
      state.order[id] = {
        qty: 1,
        price: price,
      }
    }
  }

  function canMinus(id) {
    if (state.order[id]) return true
    return false
  }

  function updateStateForMinus(id, price) {
    state.order[id].qty -= 1
    if (state.order[id].qty <= 0) {
      delete state.order[id]
    }
  }

  function commonFlow(data) {

    clearTimeout(timeout)
    timeout = setTimeout(function () {
      request('put', '/order', {
        productId: data.id,
        qty: state.order[data.id] ? state.order[data.id].qty : 0,
      })
    }, 600)

    renderProductQty(data.id, data.qtyDom)
    renderTotalQtys()
    renderTotalPrice()
  }

  function renderProductQty(id, qtyDom){
    if (state.order[id]) {
      qtyDom.textContent = state.order[id].qty
    } else {
      qtyDom.textContent = '0'
    }
  }

  function renderTotalQtys(){
    var totalQty = getStateTotalQty()
    navTotalQtyDom.textContent = totalQty
    if (mainTotalQtyDom) mainTotalQtyDom.textContent = totalQty
  }

  function renderTotalPrice(){
    if (totalPriceDom) {
      var totalPrice = getStateTotalPrice()
      totalPriceDom.textContent = totalPrice
    }
  }
}

initQtyActionDoms()