const defaultOptions = {
	url: null,
	method: 'GET',
	headers: null,
	delay: 300,
	timeout: 30,
	multiple: false,
	paramName: 'q',
	debug: false,
	minLength: null,
	placeholder: 'Search',
	blankable: false,

	// ui stuff and options/settings
	params () {},
	init () {},
	error () {},

	// user interaction
	focus () {},		// user clicks input
	blur () {},		// user leaves input
	onInput () {},	// user starts input
	keydown () {},	// user presses a key
	keyup () {},		// user releases a key
	select () {},		// user clicks an element
	reset () {},		// user resets the element to its initial state

	// data handling
	onBeforeRequest (xhr, headers, urlParams, formData) {},	// before the request to the url is sent
	onResponse (data, xhr) {},		// server sends a response
	onTimeout (xhr) {}, // if the request times out
	onErrorResponse (err, xhr) {},	// server error
	onParseResponse () {},		// parses an item from response
	onParseItems (data) { data = [] },
	onParseItem (data) {},
	onRenderItem (out, data) { return out },	// renders an item from response
}

export default defaultOptions
