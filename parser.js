HTTPViewParser.parse = (function (parse) {
	return function (view) {
		var func, code;
		try {
			code = HTTPViewParser.convert(view, false);
			func = eval(HTTPViewParser.addScope(CoffeeScript.compile(code)));
		} catch (e) {
			// This may not be CoffeeScript code.. fall back to JavaScript
			if (!CoffeeScript.quiet) {
				print('===\nCoffeeScript Error: ' + e.message + '\n\n' + code + '\n===');
			}
			func = parse(view);
		}

		print(func);
		return func;
	};
}(HTTPViewParser.parse));
