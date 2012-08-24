define(function() {
	var typecheck = function(value, type) {
		switch(type) {
			case "object":
				return (typeof value === "object" && value.length === undefined);
			break;
			case "array":
				return (typeof value === "object" && value.length !== undefined);
			break;
			default:
			return (typeof value === type);
		}
	};

	var JSArgCheck = function JSArgCheck(checks) {
		for(var c = 0, rulesLength = checks.length; c < rulesLength; c++) {
			var check = checks[c];
			var arg = check.arg;

			if (arg === undefined) {
				throw new Error("Missing argument: " + check.name);
			}

			var typeok = typecheck(arg, check.type);
			if (!typeok) {
				throw new Error("Argument: " + check.name + " does not match type: " + check.type);
			}

			if (check.minLength !== undefined) {
				if (arg.length < check.minLength) {
					throw new Error("Argument: " + check.name + " does not meet minimum length requirement of: " + check.minLength);
				}
			}

			if (check.minKeys !== undefined) {
				if (Object.keys(arg).length < check.minKeys) {
					throw new Error("Argument: " + check.name + " does not meet minimum keys requirement of: " + check.minKeys);
				}
			}
		}
	};

	return JSArgCheck;
});