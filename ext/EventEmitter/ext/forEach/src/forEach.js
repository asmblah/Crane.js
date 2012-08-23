define(function() {
	var forEach = function(obj, callback) {
		var key, length;
		if(obj) {
			if (obj.hasOwnProperty("length")) {
				for (key = 0, length = obj.length; key < length; key += 1) {
					if (callback.call(obj[key], obj[key], key) === false) {
						break;
					}
				}
			} else {
				for (key in obj) {
					if (obj.hasOwnProperty(key)) {
						if (callback.call(obj[key], obj[key], key) === false) {
							break;
						}
					}
				}
			}
		}
	}

	return forEach;
});
