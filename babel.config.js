module.exports = function (api) {
	api.cache(true)
	return {
		presets: [
			[
				"@babel/preset-env",
				{
					corejs: {
						version: "3.8",
						proposals: false
					},
					useBuiltIns: "usage" // browserslist in package.json
				}
			],
		],
		plugins: [
			[
				"@babel/plugin-transform-for-of",
				{ allowArrayLike: true }
			],
		]
	}
}