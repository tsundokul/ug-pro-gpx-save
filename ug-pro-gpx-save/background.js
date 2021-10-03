// The URLs that return GPX files
const SCOPE = ['https://tabs.ultimate-guitar.com/download/public/*'];
const DEFAULT_TOOLTIP = 'Save Ultimate-Guitar Official Tab'

// Extract GPX file body and save it in local storage
function requestListener(details) {
  let filter = browser.webRequest.filterResponseData(details.requestId);
  var rawdata = [];

  filter.ondata = event => {
    rawdata.push(event.data)
    filter.write(event.data);
  };

  // The storage key for items are prefixed with the browser tab ID
  filter.onstop = event => {
    activeTabInfo().then(tab => {
      let resId = tab.id;

      browser.storage.local.set({
        [`${resId}_gpxData`]: rawdata
      }, toggleIcon);

      filter.disconnect();
    });
  };

  return {};
}

browser.webRequest.onBeforeRequest.addListener(
  requestListener, {
    urls: SCOPE,
    types: ['xmlhttprequest']
  },
  ['blocking']
);

// Extract GPX filename from the response headers
function headersListener(e) {
  for (let header of e.responseHeaders) {
    if (header.name.toLowerCase() === 'content-disposition') {
      var gpxName = header.value.split('"')[1]

      activeTabInfo().then(tab => {
        let resId = tab.id;

        browser.storage.local.set({
          [`${resId}_gpxName`]: gpxName
        })
        .then(() => setTooltipText(gpxName));
      });
    }
  }
}

browser.webRequest.onHeadersReceived.addListener(
  headersListener, {
    urls: SCOPE,
    types: ['xmlhttprequest']
  },
  ['blocking', 'responseHeaders']
);

// Offer to save the GPX on clicking on the extension icon
function saveGpx(browserTab) {
  var resId = browserTab.id;
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
    .then(() => clearTabData(resId));

  });
}

browser.browserAction.onClicked.addListener(saveGpx);

// Update icon on tab switch
function tabActive(activeInfo) {
  let resId = activeInfo.tabId;
  let fnameKey = `${resId}_gpxName`
  var gpxData = browser.storage.local.get(fnameKey);

  gpxData.then((res) => {
    setTooltipText(res[fnameKey]);
    toggleIcon(res[fnameKey] !== undefined);
  });
}

browser.tabs.onActivated.addListener(tabActive);

// Clear storage on tab close
function clearOnClose(tabId, _){
  clearTabData(tabId);
}

browser.tabs.onRemoved.addListener(clearOnClose);

// Helpers
function clearTabData(resId) {
  // Clear storage after download
  browser.storage.local.remove(`${resId}_gpxData`);
  browser.storage.local.remove(`${resId}_gpxName`);
  clearIcon();
}

function clearIcon() {
  setTooltipText();
  toggleIcon(false);
}

function toggleIcon(state = true) {
  let icon = { true: 'pick-active.svg', false: 'pick.svg' }

  browser.browserAction.setIcon({
    path: icon[state]
  });
}

function activeTabInfo() {
  let query = {
    active: true,
    windowId: browser.windows.WINDOW_ID_CURRENT
  };

  return browser.tabs.query(query)
    .then(tabs => browser.tabs.get(tabs[0].id));
}

function setTooltipText(gpxName = undefined) {
  var tooltip_text = DEFAULT_TOOLTIP;
  gpxName && (tooltip_text = `Save ${gpxName}`);
  browser.browserAction.setTitle({title: tooltip_text});
}

// Clear storage on init
browser.storage.local.clear();
clearIcon();
