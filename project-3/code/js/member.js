function initMember() {
  var buttonDoms = [
    document.querySelector('[js-dom="login"]'),
    document.querySelector('[js-dom="signup"]'),
  ]
  buttonDoms.forEach(function(dom) {
    dom.addEventListener('click', function(e) {
      var memberDom = document.querySelector('[js-dom="member"]')
      memberDom.action = dom.getAttribute('data')
    })
  })
}

initMember()
