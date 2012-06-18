var initialized = false;
var injected = false;
chrome.browserAction.onClicked.addListener(function(tab) {
	console.log("Initialized");
	chrome.tabs.insertCSS(tab.id, {file:'background.css'});
	chrome.tabs.executeScript(tab.id, { file: 'textatron_client.js' }, function () {
		chrome.tabs.getSelected(null, function(tab) {
		  chrome.tabs.sendRequest(tab.id, {url: tab.url});
		});	
	});

	chrome.extension.onRequest.addListener( function(request) {
  	if (request.type === "extension"){
    	console.log(request.message);
  	}
  });
	
});

