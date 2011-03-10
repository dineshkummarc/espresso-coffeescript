(function () {
	var modes = {
		OUTPUT: 0,
		SCRIPT: 1
	};

	/* Converts view code into a JavaScript snippet to be eval'd */
	function convert(input) {
		var outputBuffer, instructions, mode, position, line;
		outputBuffer = '';
		instructions = [];
		mode = modes.SCRIPT;
		position = 0;
		line = '';

		function flushScript() {
			instructions.push(outputBuffer);
			outputBuffer = '';
		}

		function flushOutput() {
			/* Escape quotes */
			var script = outputBuffer.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

			/* Remove leading newlines */
			script = script.replace(/\r?\n/g, function (match, index) {
				return index && '\\r\\n' || '';
			});

			/* Remove trailing whitespace */
			script = script.replace(/\s*$/, '');

			if (script.length) {
				instructions.push(indent + 'output.print "' + script + '"');
			}

			outputBuffer = '';
		}

		while (position < input.length) {
			if (input.charAt(position) === '\n') {
				line = '';
			}

			if (mode === modes.SCRIPT) {
				if (input.substr(position, 2) === '<%') {
					indent = line.replace(/^(\s*).*$/, '$1'); 
					flushScript();
					mode = modes.OUTPUT;
					position += 1;
				} else {
					outputBuffer += input.charAt(position);
					line += input.charAt(position);
				}
			} else if (mode === modes.OUTPUT) {
				if (input.substr(position, 2) === '%>') {
					flushOutput();
					mode = modes.SCRIPT;
					position += 1;
				} else {
					outputBuffer += input.charAt(position);
					line += input.charAt(position);
				}
			}

			position += 1;
		}

		if (mode === modes.OUTPUT) {
			flushOutput();
		} else {
			flushScript();
		}

		return instructions.join('');
	};


	HTTPViewParser.parse = (function (parse) {
		return function (view) {
			var func, code;
			try {
				code = convert(view);
				func = eval(HTTPViewParser.addScope(CoffeeScript.compile(code)));
			} catch (e) {
				// This may not be CoffeeScript code.. fall back to JavaScript
				if (!CoffeeScript.quiet) {
					print('CoffeeScript Error: ' + e.message);
				}
				func = parse(view);
			}

			return func;
		};
	}(HTTPViewParser.parse));


	/* Extend load() function to automagically compile .coffee files into JavaScript */
	this.load = (function (load) {
		return function (file) {
			if (/\.coffee$/.test(file)) {
				eval(CoffeeScript.compile(readFile(file)));
			} else {
				load(file);
			}
		}.bind(this);
	}(this.load));


}());
