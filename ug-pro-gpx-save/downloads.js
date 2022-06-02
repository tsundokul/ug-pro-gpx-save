
function saveGpx(resId) {
  var dataKey = `${resId}_gpxData`
  var fnameKey = `${resId}_gpxName`
  var gpxData = browser.storage.local.get([dataKey, fnameKey]);

  gpxData.then((res) => {
    if(! res[dataKey]) return;

    var blob = new Blob(res[dataKey], {
      type: 'application/octet-stream'
    })

    browser.downloads.download({
      url: URL.createObjectURL(blob),
      filename: res[fnameKey],
      conflictAction: 'overwrite',
      saveAs: true
    })
  });
}

function displayItem(id, name) {
  let tpl = document.getElementById('template-entry');
  let row = document.createElement('div');
  row.innerHTML = tpl.innerHTML;
  row.classList.add('row', 'd-flex' ,'align-items-center' ,'item');
  row.id = `_${id}`;
  document.getElementById('items').appendChild(row);

  document.querySelector(`#_${id} span.name`).textContent = name;
  let saveBtn = document.querySelector(`#_${id} button.save`)
  saveBtn.addEventListener('click', _ => saveGpx(id))
}

function printAllTabs() {
  document.getElementById('items').innerHTML = '';

  browser.storage.local.get(null, function(items) {
    for(const [key, name] of Object.entries(items)) {
      if(key.slice(-4) !== 'Name') continue;
      let id = key.split('_').shift();
      displayItem(id, name)
    }
  });
}

function saveAll() {
  document.querySelectorAll(".row.item").forEach(item => {
    saveGpx(item.id.slice(1))
  })
}

function clearAll() {
  browser.storage.local.clear();
  printAllTabs();
}

function loadContent() {
  printAllTabs();
  document.getElementById('clear').addEventListener('click', clearAll)
  document.getElementById('save_all').addEventListener('click', saveAll)
}

window.addEventListener("focus", loadContent);
