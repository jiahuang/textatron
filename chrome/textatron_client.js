var MOUSE_VISITED_CLASSNAME = 'mouse_visited';
var MOUSE_CLICKED_CLASSNAME = 'mouse_clicked';

var IS_HIGHLIGHT = true;
/******************************************************
* Helpers
******************************************************/
function hasClass(element, cls) {
    var r = new RegExp('\\b' + cls + '\\b');
    return r.test(element.className);
}
/*
function each (e, func) {
	for (var i = 0, l=e.length; i<l; i++) {
		func(e[i]);
	}
}*/

/******************************************************
* selector form
******************************************************/
function TextatronPanel(Anchor){
	// basic dom items
	var THIS = this;
	var Panel, PanelSelector, OptionCommand, OptionUrl, OptionCss, PanelTextCmd, PanelTextUrl, PanelTextCss, PanelSave, PanelOutput, ExitButton, CSSLink;
	var Options = [{value:'Command'}, {value:'Url'}, {value:'CSS'}];
	var oldClickedSelector = [];
	var isRender = false;
	
	// helper functions
	Panel = document.createElement('div');
	Panel.setAttribute('id', 'Panel');
	//CSSLink = document.createElement("link");
	//CSSLink.href = chrome.extension.getURL("background.css");
	//CSSLink.rel = "stylesheet"; 
	//CSSLink.type = "text/css";
	
	PanelSelector = document.createElement('select');
	PanelSelector.setAttribute("id", "panelSelector");
	
	OptionCommand = document.createElement("option");
	OptionCommand.setAttribute("value", Options[0].value);
	OptionCommand.innerHTML = Options[0].value;

	OptionUrl = document.createElement("option");
	OptionUrl.setAttribute("value", Options[1].value);
	OptionUrl.innerHTML = Options[1].value;

	OptionCss = document.createElement("option");
	OptionCss.setAttribute("value", Options[2].value);
	OptionCss.innerHTML = Options[2].value;

	PanelTextCmd = document.createElement('input');
	PanelTextCmd.setAttribute('type', 'text');
	PanelTextCmd.setAttribute('id', 'panelTextCmd');
	PanelTextCmd.classList.add('panelText');

	PanelTextUrl = document.createElement('input');
	PanelTextUrl.setAttribute('type', 'text');
	PanelTextUrl.setAttribute('id', 'panelTextUrl');
	PanelTextUrl.className = 'panelText hidden';

	PanelTextCss = document.createElement('input');
	PanelTextCss.setAttribute('type', 'text');
	PanelTextCss.setAttribute('id', 'panelTextCss');
	PanelTextCss.className = 'panelText hidden';

	PanelSave = document.createElement('input');
	PanelSave.setAttribute('type', 'button');
	PanelSave.setAttribute('id', 'panelSave');
	PanelSave.setAttribute('value', 'save');

	PanelOutput = document.createElement('div');
	PanelOutput.setAttribute('id', 'panelOutput');

	PanelSelector.addEventListener('change', function () {
		PanelTextCmd.classList.add('hidden');
		PanelTextUrl.classList.add('hidden');
		PanelTextCss.classList.add('hidden');

		if (PanelSelector.selectedIndex == 0){
			PanelTextCmd.classList.remove('hidden');
		}
		else if (PanelSelector.selectedIndex == 1){
			PanelTextUrl.classList.remove('hidden');
		}
		else if (PanelSelector.selectedIndex == 2){
			PanelTextCss.classList.remove('hidden');
		}
	});

	// http://stackoverflow.com/questions/133925/javascript-post-request-like-a-form-submit
	function postToURL(path, params, method) {
    method = method || "post"; // Set method to post by default, if not specified.

    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    var form = document.createElement("form");
    form.setAttribute("method", method);
    form.setAttribute("action", path);

    for(var key in params) {
        if(params.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);

            form.appendChild(hiddenField);
         }
    }

    form.submit();
	}

	PanelSave.addEventListener('click', function() {
		var params = {'url':PanelTextUrl.value, 'cmd':PanelTextCmd.value, 'css':PanelTextCss.value};

		// fake a post
		postToURL('textatron.com/commands/new', params);
	});

	this.setUrl = function (url){
		PanelTextUrl.value = url;
	}

	this.getCssSelector = function (e) {
		var cssSelector = e.tagName;
    //chrome.extension.sendRequest({type:"extension", message: "Css Selector"});

		if(e.id)
			cssSelector += "#" + e.id; // ids should be unique
		if(e.className) {
			var eClasses = e.className.split(' ');
			for (var i = 0, l = eClasses.length; i<l; i++) {
				var eClass = eClasses[i];
				if (eClass != MOUSE_VISITED_CLASSNAME && eClass != MOUSE_CLICKED_CLASSNAME) {
					cssSelector += '.' + eClass;
				}
			}
			for (var attr, i=0, attrs=e.attributes, l=attrs.length; i<l; i++){
					attr = attrs.item(i);
					if (attr.nodeName.toLowerCase() != 'class' && attr.nodeName.toLowerCase() != 'id'){
			    	cssSelector += '['+attr.nodeName+'="'+attr.nodeValue+'"]';
			   	}
			}
		}
		return cssSelector;
	}

	PanelTextCss.addEventListener('input', function(){
    chrome.extension.sendRequest({type:"extension", message: oldClickedSelector});
    var temp = PanelTextCss.value.replace(/\s/g, "");
    var selectors = temp.split(',');
		
		for (var i = 0, l=selectors.length; i<l; i++){
			var selector = selectors[i];
			var index = oldClickedSelector.indexOf(selector);
			if (selector &&  index > -1) {
    		chrome.extension.sendRequest({type:"extension", message: "popped from old: "+ selector + " "+String(oldClickedSelector)});
				oldClickedSelector.splice(index, 1);
    		chrome.extension.sendRequest({type:"extension", message: "post popping: "+oldClickedSelector});

			} else if (selector) {
    		chrome.extension.sendRequest({type:"extension", message: "not in old: "+selector});

				var e = document.querySelectorAll(selector);
				for (var a = 0, l = e.length; a<l; a++) {
					e[a].classList.add(MOUSE_CLICKED_CLASSNAME); // apply the background
				}
			}
		}
		
		for (var i = 0, l = oldClickedSelector.length; i < l; i++) {
			if (oldClickedSelector[i]) {
				var e = document.querySelectorAll(oldClickedSelector[i]);
				// remove unused selectors
	    	chrome.extension.sendRequest({type:"extension", message: "removing from: "+oldClickedSelector[i]});

				for (var a = 0, l = e.length;a<l; a++) {
					e[a].classList.remove(MOUSE_CLICKED_CLASSNAME);
				}
			}
		}

		oldClickedSelector = selectors;
	}, false);

	this.addCSS = function(e){
		// gets the css of e and adds it
    chrome.extension.sendRequest({type:"extension", message: "add css"});

		var cssString = PanelTextCss.value;
		cssString = cssString + THIS.getCssSelector(e) + ', ';
		PanelTextCss.value = cssString;
		var temp = cssString.replace(/\s/g, "");
		oldClickedSelector = temp.split(',');
	}

	this.resetCSS = function () {
		PanelTextCss.value = "";
		oldClickedSelector = "";
	}

	this.removeCSS = function(e){
		// removes the css path of e
		var cssString = PanelTextCss.value;
		var toRemove = THIS.getCssSelector(e);
		cssString = cssString.replace(toRemove+', ', '');
		cssString = cssString.replace(toRemove, '');
		PanelTextCss.value = cssString;
		var temp = cssString.replace(/\s/g, "");
		oldClickedSelector = temp.split(',');
	}

	this.render = function(){
		if (!isRender){
			Anchor.appendChild(Panel);
			//Panel.contentDocument.head.appendChild(CSSLink);
			PanelSelector.appendChild(OptionCommand);
			PanelSelector.appendChild(OptionUrl);
			PanelSelector.appendChild(OptionCss);
			Panel.appendChild(PanelSelector);
			Panel.appendChild(PanelTextCmd);
			Panel.appendChild(PanelTextUrl);
			Panel.appendChild(PanelTextCss);
			Panel.appendChild(PanelSave);
			Panel.appendChild(PanelOutput);
			isRender = true;
		}
	}

	this.isRendered = function(){
		return isRender;
	}

	this.isInPanel = function (e){
		var ObjList = [Panel, PanelSelector, PanelTextCmd, PanelTextUrl, PanelTextCss, PanelSave, PanelOutput, ExitButton];
		if (ObjList.indexOf(e) > -1)
			return true;
		return false;
	}

	this.isHidden = function () {
		return Panel.className.indexOf('hidden') != -1 ? true: false;
	}

	this.hide = function () {
	  chrome.extension.sendRequest({type:"extension", message: "panel hidden"});

		Panel.classList.add('hidden');
	}

	this.show = function () {
		Panel.classList.remove('hidden');
	}
}

/******************************************************
* main
******************************************************/

// Previous dom, that we want to track, so we can remove the previous styling.
var PREV_DOMS;
var CLICKED_DOMS;
var PANEL;

if (PANEL && PANEL.isHidden()) {
	chrome.extension.sendRequest({type:"extension", message: "show"});

	IS_HIGHLIGHT = true;
	PANEL.show();
}
else if (PANEL) {
	chrome.extension.sendRequest({type:"extension", message: "hide"});
	PANEL.hide();
	IS_HIGHLIGHT = false;
	
	if (PREV_DOMS != null) {
		for (var i =0, l=PREV_DOMS.length; i<l; i++) {
      PREV_DOMS[i].classList.remove(MOUSE_VISITED_CLASSNAME);
    }
	}
	for (var i = 0, l = CLICKED_DOMS.length; i<l; i++) {
		CLICKED_DOMS[i].classList.remove(MOUSE_CLICKED_CLASSNAME);
	}
	PREV_DOMS = null;
	CLICKED_DOMS = [];
	PANEL.resetCSS();
}

if (PANEL == null) {
	chrome.extension.sendRequest({type:"extension", message: "client intialized"});
	CLICKED_DOMS = [];
	PREV_DOMS = null;
	PANEL = new TextatronPanel(document.body);
	if (!PANEL.isRendered()){
  	PANEL.render();
	}
	
	chrome.extension.onRequest.addListener( function(request, sender, sendResponse) {
	  if (request.url){
	  	PANEL.setUrl(request.url);
	  }
	});

	// Mouse listener for any move event on the current document.
	document.addEventListener('mousemove', function (e) {
	  var srcElement = e.srcElement;
	  if (IS_HIGHLIGHT && !PANEL.isInPanel(srcElement)){
	    // get element css
	    var css = PANEL.getCssSelector(srcElement);
	    var matchingElements = document.querySelectorAll(css);
	    if (PREV_DOMS != null) {
	    	for (var i =0, l=PREV_DOMS.length; i<l; i++) {
	      	PREV_DOMS[i].classList.remove(MOUSE_VISITED_CLASSNAME);
	    	}
	    }
	    // Add a visited class name to the element
	    for (var i=0, l=matchingElements.length; i<l; i++) {
	    	matchingElements[i].classList.add(MOUSE_VISITED_CLASSNAME);
	    }
	    
	    PREV_DOMS = matchingElements;
	  }
	}, false);

	document.addEventListener('mousedown', function (e) {
		// check if element is highlighted
	  //chrome.extension.sendRequest({type:"extension", message: "clicked"});
		var srcElement = e.srcElement;
		var css = PANEL.getCssSelector(srcElement);
	  var matchingElements = document.querySelectorAll(css);

		// if its mouse clicked, remove it
		if (hasClass(srcElement, MOUSE_CLICKED_CLASSNAME) ){
			for (var i=0, l=matchingElements.length; i<l; i++) {
				matchingElements[i].classList.remove(MOUSE_CLICKED_CLASSNAME);
				CLICKED_DOMS.pop(matchingElements[i]);
			}
		  // bring up popup form
	    PANEL.removeCSS(srcElement);
		}

		// if its mouse visited, add it
		if (hasClass(srcElement, MOUSE_VISITED_CLASSNAME) ){
			for (var i=0, l=matchingElements.length; i<l; i++) {
		  	matchingElements[i].classList.remove(MOUSE_VISITED_CLASSNAME);
		  	matchingElements[i].classList.add(MOUSE_CLICKED_CLASSNAME);
				CLICKED_DOMS.push(matchingElements[i]);
		  }
		  
		  PANEL.addCSS(srcElement);
		}
	}, false);
}

document.addEventListener('keypress', function (e) {
	if (e.keyCode == 27 && IS_HIGHLIGHT) {
		IS_HIGHLIGHT = false;
	}
}, false);