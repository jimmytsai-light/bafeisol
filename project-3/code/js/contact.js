function initContact() {
  var fieldDoms = document.querySelectorAll('[js-dom="field"]')
  var contactDom = document.querySelector('[js-dom="contact"]')

  for (var i = 0; i < fieldDoms.length; i++) {
    addListenerForFieldDom(fieldDoms[i])
  }

  function addListenerForFieldDom(fieldDom) {
    fieldDom.addEventListener('input', function(e) {
      /*
        等日後完成Back-end再來補這段
       */
    })
  }

  contactDom.addEventListener('submit', function(e) {
    e.preventDefault()
    contactDom.appendChild(createOrderFieldDom())
    /*
      為何Back-end有的data，我們還要再送一次呢？
      這個是為了避免Back-end存的資料和使用者最後看到的資料(例如：收貨地址)有不一致，
      若有不一致，則以使用者最後看到的資料為準。
    */
    contactDom.submit()
  })

  function createOrderFieldDom() {
    var orderFieldDom = document.querySelector('[name="order"]')
    if (orderFieldDom) {
      orderFieldDom.remove()
    }
    orderFieldDom = document.createElement('input')
    orderFieldDom.style.display = 'none'
    orderFieldDom.name = 'order'
    orderFieldDom.type = 'text'
    var valueObj = {}
    for (key in state.order) {
      valueObj[key] = {
        qty: state.order[key].qty,
      }
    }
    orderFieldDom.value = JSON.stringify(valueObj)
    return orderFieldDom
  }
}

initContact()
