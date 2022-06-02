// The URLs that return GPX files
const SCOPE = ['https://tabs.ultimate-guitar.com/download/public/*'];
const DEFAULT_TOOLTIP = 'Save Ultimate-Guitar Official Tab'

async function sha1(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  return crypto.subtle.digest('SHA-256', data).then(hash => {
    const hashArray = Array.from(new Uint8Array(hash));                   
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  });
}

// Extract GPX file body and save it to local storage
function requestListener(e) {
  let filter = browser.webRequest.filterResponseData(e.requestId);
  var rawdata = [];

  filter.ondata = event => {
    rawdata.push(event.data)
    filter.write(event.data);
  };

  // The storage key for items are prefixed with the browser tab ID
  filter.onstop = _ => {
    sha1(e.url).then(resId => {
      browser.storage.local.set({
        [`${resId}_gpxData`]: rawdata
      });

      filter.disconnect();
    });
  };
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

      sha1(e.url).then(resId => {
        browser.storage.local.set({
          [`${resId}_gpxName`]: gpxName
        })
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


function openDownloads() {
  browser.tabs.create({
    url: browser.runtime.getURL('downloads.html')
  });
}
browser.browserAction.onClicked.addListener(openDownloads);
