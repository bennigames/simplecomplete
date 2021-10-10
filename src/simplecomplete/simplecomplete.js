import contentloaded from './utils/contentloaded.js'
import _defaults from './options.js'

export default class SimpleComplete {
	static KEYS = {
		ENTER: 13,
		TAB: 9
	}

	static client = new XMLHttpRequest()

	static initClass () {
		this.prototype.events = []

		window.contentloaded = contentloaded
	}

	constructor (el, options = null) {
		this.results = null
		this.query = null
		this.launchedRequest = null
		this.options = {
			..._defaults,
			...(options || {})
		}

		if ('string' === typeof el) {
			let els = document.querySelectorAll(el)
			if (els && els.length > 0) {
				els.forEach(el => {
					if (!SimpleComplete.instances) {
						SimpleComplete.instances = []
					}
					SimpleComplete.instances.push(new SimpleComplete(el, options))
				})
			}
		} else {
			this.element = el

			if (this.element.simplecomplete) {
				throw new Error('nope')
			}

			this.element.simplecomplete = this
			this.hideOrigin ()
			this.initDOM ()
			this.initEvents ()

			this.updateLabel ()
		}
	}

	hideOrigin () {
		if(!this.options.debug) {
			this.element.style.width = '1px';
			this.element.style.height = '1px';
			this.element.style.position = 'absolute'
			this.element.style.left = `${-window.innerWidth * 99}px`
			this.element.style.top = '0'
		} else {
			this.element.style.border = 'solid 3px red'
			this.element.style.marginTop = '1em'
			this.element.style.marginBottom = '1em'
		}
	}

	initDOM () {
		this.parentNode = this.element.parentNode

		this.wrapper = SimpleComplete.createElement('DIV', {
			classes: 'simplecomplete'
		})

		if (this.options.blankable) {
			this.wrapper.classList.add('is-blankable')
		}

		if (this.isMultiple()) {
			this.wrapper.classList.add('is-multiple')
		}

		if (this.isSelectElement()) {
			this.wrapper.classList.add('is-select')
		}

		let inputWrapper = SimpleComplete.createElement('DIV', {
			classes: 'simplecomplete__input'
		})

		this.fakeInput = SimpleComplete.createElement('DIV', {
			classes: 'simplecomplete__input-field'
		})
		this.cancelInputBtn = SimpleComplete.createElement('A', {
			classes: 'simplecomplete__input-cancel'
		})

		this.cancelInputBtn.addEventListener('click', e => {
			e.preventDefault ()
			e.stopPropagation ()
			document.body.dispatchEvent(new Event('click'))
		})

		inputWrapper.appendChild(this.fakeInput)
		inputWrapper.appendChild(this.cancelInputBtn)

		this.currentValue = SimpleComplete.createElement('DIV', {
			classes: 'simplecomplete__value'
		})

		this.wrapper.appendChild(this.currentValue)
		this.wrapper.appendChild(inputWrapper)

		// render results
			let resultsWrapper = SimpleComplete.createElement('DIV', {
				classes: 'simplecomplete__results'
			})

			this.resultsList = SimpleComplete.createElement('DIV', {
				classes: 'simplecomplete__results-list'
			})

			resultsWrapper.appendChild(this.resultsList)
			this.wrapper.appendChild(resultsWrapper)

		// insert wrapper into parentnode of element
			this.element.parentNode.insertBefore(this.wrapper, this.element.nextSibling)

		this.onResults(Array.from(this.element.options || []))
	}

	initEvents () {
		this.element.addEventListener('focus', e => {
			e.preventDefault ()
			this.onFocus ()
		})
		this.wrapper.addEventListener('click', this.onFocus.bind(this))
		this.currentValue.addEventListener('click', this.onFocus.bind(this))

		this.fakeInput.addEventListener('keydown', e => {
			switch (e.keyCode) {
				case SimpleComplete.KEYS.TAB:
				case SimpleComplete.KEYS.ENTER:
					e.preventDefault()
					return false
			}
		})
		this.fakeInput.addEventListener('keyup', this.onInput.bind(this))
	}

	onInput (e) {
		if (this.launchedRequest) {
			window.clearTimeout(this.launchedRequest)
		}

		switch (e.keyCode) {
			case SimpleComplete.KEYS.ENTER:
				this.onSend()
			case SimpleComplete.KEYS.TAB:
				e.preventDefault()
				return false
		}

		this.query = e.target.textContent.trim()
		this.launchedRequest = window.setTimeout(this.onSend.bind(this), this.options.delay || 300)
		this.onResults()
	}

	finishRequest (xhr) {
		this.wrapper.classList.remove('is-busy')
	}

	sendRequest (_cb = null) {
		let headers = {
			Accept: 'application/json',
			'Cache-Control': 'no-cache',
			'X-Requested-With': 'XMLHttpRequest',
			...(this.options.headers || {})
		}
		let params = {
			...(this.options.params || {})
		}

		params[this.options.paramName || 'q'] = this.query

		let formData = new FormData()
		let urlParams = new URLSearchParams()
		let target = this.options.url

		let xhr = SimpleComplete.client

		xhr.abort()
		xhr.addEventListener('load', e => {
			this.finishRequest (xhr)
			this.handleResponse (xhr, params, formData, e)
		})
		xhr.addEventListener('timeout', (e) => {
			this.finishRequest (xhr)
			this.options.onTimeout (xhr)
		})
		xhr.addEventListener('error', (e) => {
			this.finishRequest (xhr)
			this.options.onErrorResponse (e, xhr)
		})

		Object.keys(params).forEach(_key => {
			urlParams.set(_key, params[_key])
			formData.append(_key, params[_key])
		})

		this.options.onBeforeRequest(xhr, headers, urlParams, formData)

		target += `?${urlParams.toString()}`

		xhr.open(
			this.options.method || 'GET',
			target
		)

		if (xhr.readyState != 1) {
			console.log(xhr.readyState)
			this.onError('xhr_not_ready')
			return;
		}

		Object.keys(headers).forEach(_key => xhr.setRequestHeader(_key, headers[_key]))

		SimpleComplete.timeout = (this.options.timeout || 30) * 1000

		xhr.send(formData)
	}

	handleResponse (xhr, params, formData, e) {
		let response = xhr.responseText || null
		let err = null
		if (response && xhr.getResponseHeader('Content-Type').includes("application/json")) {
			try {
				response = JSON.parse(response)
				this.options.onParseResponse(response)

				if (!Array.isArray(response)) {
					throw new Error('simplecomplete.errors.no_array_response')
				} else {
					console.log(response)
				}
			} catch(_e) {
				err = _e

				this.options.onParseResponse(response)
			}
		}

		if (!(200 <= xhr.status && xhr.status < 300)) {
			this.onError('simplecomplete.errors.xhr_wrong_status')
		} else {
			let data =

			this.options.onResponse (response, xhr)
			this.onResults(response.data || response)
		}
	}

	onSend (e = null) {
		if (!this.query || (this.options.minLength > 0 && this.query.length < this.options.minLength)) {
			this.onError('simplecomplete.errors.min-length')
		} else {
			if (this.wrapper.classList.contains('is-busy')) {
				this.queued = true
			} else if (this.options.url) {
				this.wrapper.classList.add('is-busy')

				this.sendRequest((xhr) => {
					console.log('DONE', xhr)
				})

				/*window.setTimeout(() => {
					this.wrapper.classList.remove('is-busy')
					if(this.queued) {
						this.queued = false
						this.onSend ()
					}
				}, 3000)*/
			}
		}
	}

	isMultiple () {
		return this.element.multiple || false
	}

	deselectOption (_val) {
		let _opts = Array.from(this.element.selectedOptions)

		for (let _key in _opts) {
			let o = _opts[_key]
			if (o.value == _val) {
				o.selected = false
				break
			}
		}
	}

	selectOption (_val) {
		let _opts = Array.from(this.element.options)

		for (let _key in _opts) {
			let o = _opts[_key]
			if (o.value == _val) {
				o.selected = true
				break
			}
		}
	}

	updateValue (_val = null) {
		if (_val !== null || this.options.blankable) {
			if (this.isMultiple()) {
				if (this.isSelected(_val)) {
					this.deselectOption (_val)
				} else {
					this.selectOption (_val)
				}
			} else {
				this.element.value = _val
			}

		}
		this.updateLabel ()
		this.onResults ()
	}

	isSelectElement () {
		return (this.element.tagName || false) && 'SELECT' == this.element.tagName
	}

	updateLabel () {
		this.currentValue.classList.remove('is-empty')
		this.currentValue.innerHTML = ''
		if (this.isMultiple() || this.isSelectElement()) {
			let _opts = Array.from(this.element.selectedOptions)
			for (let _key in _opts) {
				let o = _opts[_key]

				let badge = SimpleComplete.createElement('SPAN', {
					classes: 'selected-option'
				})

				badge.textContent = o.textContent
				badge.dataset.value = o.value
				if (this.isMultiple() || this.options.blankable) {
					badge.addEventListener('click', e => {
						e.preventDefault ()
						e.stopPropagation ()
						this.deselectOption(e.target.dataset.value)
						this.updateValue()
					})
				}

				this.currentValue.appendChild(badge)
			}
		}

		if(!this.currentValue.childNodes.length) {
			let placeholder = this.element.value || this.element.getAttribute('placeholder') || this.element.dataset.placeholder || this.options.placeholder || 'Search'
			if (this.isSelectElement()) {
				let badge = SimpleComplete.createElement('SPAN', {
					classes: 'empty-item'
				})

				badge.textContent = placeholder

				this.currentValue.appendChild(badge)
			} else {
				this.currentValue.textContent = placeholder
			}

			if (placeholder == this.options.placeholder) {
				this.currentValue.classList.add('is-empty')
			}
		}
	}

	onError (key) {
		console.log(key)
	}

	onFocus (e) {
		if (e) {
			e.stopPropagation()
		}
		document.body.dispatchEvent(new Event('click'))
		this.wrapper.classList.add('active')
		if (this.results.length > 0) {
			this.wrapper.classList.add('has-results')
		}
		this.currentValue.classList.add('hide')
		this.fakeInput.setAttribute('contenteditable', true)
		this.fakeInput.focus()

		this.options.focus()

		document.body.addEventListener('click', e => {
			this.onBlur()
		}, {once:true})
	}

	onBlur () {
		this.query = null
		this.fakeInput.textContent = ''
		this.wrapper.classList.remove('active')
		this.currentValue.classList.remove('hide')
		this.fakeInput.setAttribute('contenteditable', false)

		this.wrapper.classList.remove('has-results')

		this.onResults ()

		this.options.blur()
	}

	onSelect (_val) {
		this.updateValue (_val)
		document.body.dispatchEvent(new Event('click'))
	}

	onResults (data = null) {
		try {
			if(data !== null) {
				if (!Array.isArray(data)) {
					this.onError('simplecomplete.errors.data_invalid')
					return
				}

				this.options.onParseItems (data)
				this.results = data.map(res => {
					let item = this.options.onParseItem(res) || res

					switch(typeof item) {
						case 'string':
							item = {
								value: item,
								label: item
							}
							break
						case 'object':
							item = {
								value: item.id || item.value,
								label: item.label || item.name
							}
							break
						default:
							if (Array.isArray(item) && item.length > 0) {
								item = {
									value: item[0],
									label: item[item.length - 1]
								}
							} else {
								throw new Error('simplecomplete.errors.invalid response item')
							}
							break
					}

					return item
				})

				if (this.results && this.isSelectElement ()) {
					[...this.element.options].forEach(option => {
						if (!this.isSelected(option.value)) {
							option.remove()
						}
					})

					this.results.forEach(item => {
						let option = SimpleComplete.createElement('OPTION')
						option.value = item.value || item.id
						option.textContent = item.label || item.name || item

						if (!this.isSelected(option.value)) {
							this.element.appendChild(option)
						}
					})
				}
			}

			if(this.results && this.resultsList) {
				this.resultsList.innerHTML = ''
				if (this.isSelectElement ()) {
					[...this.element.options].forEach(option => {
						this.resultsList.appendChild(this.renderOption({
							value: option.value,
							label: option.textContent
						}))
					})
				} else {
					this.results.forEach( res => this.resultsList.appendChild(this.renderOption(res)) )
				}

				if (!this.resultsList.childNodes.length) {
					let emptyNode = SimpleComplete.createElement('DIV', {
						classes: 'simplecomplete__results-list-empty'
					})

					emptyNode.textContent = this.options.emptyText || 'No results'

					this.resultsList.appendChild(emptyNode)
				}
			}
		} catch(err) {
			this.onError(err)
		}
	}

	isSelected (_val) {
		let opts = Array.from(this.element.selectedOptions || [])
		for (let _index = 0; _index < opts.length; _index++) {
			let option = opts[_index]
			if (option.value == _val) {
				return true
			}
		}
		return this.element.value == _val || false
	}

	renderOption (data) {
		let _out = SimpleComplete.createElement('A', {
			classes: 'simplecomplete__results-list-item'
		})

		if (this.isSelected(data.value)) {
			_out.classList.add('selected')
		}

		if (data.disabled) {
			_out.classList.add('disabled')
		}

		if (!this.isSelected(data.value) || this.isMultiple()) {
			_out.addEventListener('click', e => {
				e.preventDefault ()
				e.stopPropagation ()
				if (!data.disabled) {
					this.onSelect(data.value)
				}
			})
		}

		// cut the label and mark the search term in the label if the search term is set
		if (!!this.query) {
			let regexp = new RegExp(this.query,'gi')
			let label = data.label

			let check = label.matchAll(regexp)

			if(check) {
				let hightlightSpan = SimpleComplete.createElement('SPAN', {
					classes: 'highlight'
				});
				let offset = 0;
				[...check].forEach(res => {
					hightlightSpan.textContent = res[0]
					let parts = [
						label.substr(0, res.index),
						hightlightSpan.outerHTML,
						label.substr(offset + res.index + res[0].length, label.length + offset)
					]

					offset += hightlightSpan.outerHTML.length

					label = parts.join('')
				})
			}
			_out.innerHTML = label
		} else {
			_out.textContent = data.label
		}

		try {
			return this.options.onRenderItem(_out, data)
		} catch(err) {
			return _out
		}
	}
}

SimpleComplete.initClass ()

SimpleComplete.version = 'dev'

SimpleComplete.options = {}

SimpleComplete.instances  = []

SimpleComplete.autoDiscover = true

SimpleComplete.discover = () => {
	let inputs = document.querySelectorAll('[data-sc]')
	let res = []

	if (inputs && inputs.length > 0) {
		inputs.forEach(_in => {
			let options = {
				url: _in.dataset.sc || null,
				paramName: _in.dataset.param || _defaults.paramName,
				minLength: _in.dataset.minLength !== null ? _in.dataset.minLength : null,
				blankable: _in.dataset.blankable || false
			}
			res.push(new SimpleComplete(_in, options));
		})
	}
	return res;
}

SimpleComplete.createElement = function (tag) {
	let options = arguments[1] || {}
	options = {
		id: null,
		classes: null,
		attributes: null,
		styles: null,
		data: null,
		...options
	}

	let el = document.createElement(tag)

	if (el) {
		if (options.styles) {
			el.styles = options.styles
		}
		if (options.classes) {
			if ('string' == typeof options.classes) {
				options.classes = options.classes.split(' ')
			}
			options.classes.forEach(_class => el.classList.add(_class))
		}

		if (options.attributes) {
			Object.keys(options.attributes).forEach(_key => el.setAttribute(_key, options.attributes[_key]))
		}

		if (options.data) {
			Object.keys(options.data).forEach(_key => {
				el.dataset[_key] = options.data[_key]
			})
		}
	}

	return el
}

SimpleComplete.getElement = (el, name) => {
	let $el = null

	if (document.querySelectorAll) {
		$el = document.querySelector(el)
	} else if(!!el.nodeType) {
		$el = el
	}

	if (!$el) {
		throw new Error('')
	}

	return $el
}

SimpleComplete.__autoDiscoverFunc = () => {
	if (SimpleComplete.autoDiscover) {
		return SimpleComplete.discover()
	}
}

contentloaded(window, SimpleComplete.__autoDiscoverFunc)

export { SimpleComplete }
