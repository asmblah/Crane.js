define(["../ext/forEach/src/forEach"], function(forEach) {
	var EventEmitter = function(func) {
		this.events = {};
		this.func = func;
		return this;
	}

	EventEmitter.prototype.emit = function(event, param1, param2) {
		var self = this;
		forEach(self.events, function(v, k) {
			if (k === event) {
				forEach(self.events[k], function(v, k) {
					v(param1, param2);
				});
			}
		});
	};

	EventEmitter.prototype.on = function(event, callback) {
		if(typeof this.events[event] === 'undefined') {
			this.events[event] = [];
		}

		this.events[event].push(callback);

		return this;
	};

	return EventEmitter;
});