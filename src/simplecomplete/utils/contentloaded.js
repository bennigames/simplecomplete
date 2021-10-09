/*
* contentloaded.js
*
* Author: Diego Perini (diego.perini at gmail.com)
* Summary: cross-browser wrapper for DOMContentLoaded
* Updated: 20101020
* License: MIT
* Version: 1.2
*
* URL:
* http://javascript.nwbox.com/ContentLoaded/
* http://javascript.nwbox.com/ContentLoaded/MIT-LICENSE
*/

export default function contentLoaded (win, fn) {
	let done = false;
	let top = true;
	let doc = win.document;
	let root = doc.documentElement;
	let add = doc.addEventListener ? "addEventListener" : "attachEvent";
	let rem = doc.addEventListener ? "removeEventListener" : "detachEvent";
	let pre = doc.addEventListener ? "" : "on";
	var init = function (e) {
		if (e.type === "readystatechange" && doc.readyState !== "complete") {
			return;
		}
		(e.type === "load" ? win : doc)[rem](pre + e.type, init, false);
		if (!done && (done = true)) {
			return fn.call(win, e.type || e);
		}
	};

	var poll = function () {
		try {
			root.doScroll("left");
		} catch (e) {
			setTimeout(poll, 50);
			return;
		}
		return init("poll");
	};

	if (doc.readyState !== "complete") {
		if (doc.createEventObject && root.doScroll) {
			try {
				top = !win.frameElement;
			} catch (error) {}
			if (top) {
				poll();
			}
		}
		doc[add](pre + "DOMContentLoaded", init, false);
		doc[add](pre + "readystatechange", init, false);
		return win[add](pre + "load", init, false);
	}
}
