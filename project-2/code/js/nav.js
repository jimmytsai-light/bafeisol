function initNav() {
  var button = document.querySelector('#mobile-menu-button')
  var nav = document.querySelector('nav')
  button.addEventListener('click', function(e) {
    button.classList.toggle('active')
    nav.classList.toggle('active')
  })
}

initNav()
