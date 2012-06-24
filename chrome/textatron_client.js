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

/******************************************************
* selector form
******************************************************/
function TextatronPanel(Anchor){
	// basic dom items
	var THIS = this;
	var Panel, PanelForm, PanelIFrame, PanelSelector, OptionCommand, OptionUrl, OptionCss, PanelTextCmd, PanelTextUrl, PanelTextCss, PanelSave, PanelOutput, ExitButton, CSSLink;
	var Options = [{value:'Command'}, {value:'Url'}, {value:'CSS'}];
	var oldClickedSelector = [];
	var isRender = false;
	
	// helper functions
  function createItem(elementType, attrs) {
  	var temp = document.createElement(elementType);
  	for(var key in attrs) {
        if(attrs.hasOwnProperty(key))
            temp.setAttribute(key, attrs[key]);
    }
    return temp;
  }

	Panel = createItem('div', {id: 'Panel'});
	PanelIframe = createItem('iframe', {class:'hidden', name:'panelIFrame', id:'panelIFrame'});
	PanelSelector = createItem('select', {id:'panelSelector'});

	OptionCommand = createItem("option", {value:Options[0].value});
	OptionCommand.innerHTML = Options[0].value;
	OptionUrl = createItem("option", {value:Options[1].value});
	OptionUrl.innerHTML = Options[1].value;
	OptionCss = createItem("option", {value:Options[2].value});
	OptionCss.innerHTML = Options[2].value;

	PanelTextCmd = createItem('input', {type:'text', id:'panelTextCmd', name:'cmd', class:'panelText'});
	PanelTextUrl = createItem('input', {type:'text', id:'panelTextUrl', name:'url', class:'panelText hidden'});
	PanelTextCss = createItem('input', {type:'text', id:'panelTextCss', name:'css', class:'panelText hidden'});
	PanelSave = createItem('input', {type:'button', id:'panelSave', value:'save'});
	PanelOutput = createItem('div', {id:'panelOutput', class:'hidden'});
	PanelForm = createItem("div"); 
	
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

	PanelSave.addEventListener('click', function() {
		var req = new XMLHttpRequest();
		//if (!req) return;
		var method = "POST";
		var postData = "cmd="+encodeURIComponent(PanelTextCmd.value)+"&url="+encodeURIComponent(PanelTextUrl.value)+"&css="+encodeURIComponent(PanelTextCss.value);
		console.log(postData);
		req.open(method, 'http://getouttahere.me/command/new',true);
		//req.setRequestHeader('User-Agent','XMLHTTP/1.0');

		if (postData)
			req.setRequestHeader('Content-type','application/x-www-form-urlencoded');
		req.onreadystatechange = function () {
			if (req.readyState != 4) return;
			if (req.status != 200 && req.status != 304) {
				//			alert('HTTP error ' + req.status);
				return;
			}
			//callback(req);
			var res = JSON.parse(req.responseText);
			var resMsg = res['success'] ? res['success'] : res['error'];
			console.log(resMsg);
			PanelForm.classList.add('hidden');
			PanelOutput.innerHTML = resMsg;
			PanelOutput.classList.remove('hidden');
		}
		if (req.readyState == 4) return;
		req.send(postData);
		return false;
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
			PanelForm.appendChild(PanelSelector);
			PanelForm.appendChild(PanelTextCmd);
			PanelForm.appendChild(PanelTextUrl);
			PanelForm.appendChild(PanelTextCss);
			PanelForm.appendChild(PanelSave);
			Panel.appendChild(PanelForm);
			Panel.appendChild(PanelOutput);
			isRender = true;
		}
	}

	this.isRendered = function(){
		return isRender;
	}

	this.isInPanel = function (e){
		var ObjList = [Panel, PanelForm, PanelSelector, PanelTextCmd, PanelTextUrl, PanelTextCss, PanelSave, PanelOutput, ExitButton];
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

//window.addEventListener('message', PANEL.handleResponse, false);

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