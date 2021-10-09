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
	onBeforeRequest () {},	// before the request to the url is sent
	onRequest () {},
	onResponse () {},		// server sends a response
	onErrorResponse () {},	// server error
	onParseItem () {},		// parses an item from response
	onRenderItem (out, data) { return out },	// renders an item from response
}

export default defaultOptions
