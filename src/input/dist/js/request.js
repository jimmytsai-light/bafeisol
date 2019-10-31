function request(method, path, data) {
  xhr = new XMLHttpRequest()
  xhr.addEventListener('load', function(e) {
    // 接收到response後，接著要執行的callback。
    var status = xhr.status
    if ((status !== 200) && (status !== 204)) {
      alert('伺服器異常，資料未同步成功，請稍後再試。')
    }
  })
  xhr.open(method, path)
  xhr.setRequestHeader('Content-Type', 'application/json')
  if (data) {
    xhr.send(JSON.stringify(data))
  } else {
    console.error('無資料送出。請確認data是否有值。')
  }
}