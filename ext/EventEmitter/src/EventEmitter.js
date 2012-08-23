define(["../ext/forEach/src/forEach"], function(forEach) {
	var EventEmitter = function(func) {
		this.events = {};
		this.func = func;
		return this;
	}

	EventEmitter.prototype.emit = function(event, param1, param2) {
		var self = this;

		if (self.events[event] !== undefined) {
			forEach(self.events[event], function(v, k) {
				v(param1, param2);
			});

			return true;
		}

		return false;
	};

	EventEmitter.prototype.on = function(event, callback) {
		var self = this;

		if(typeof self.events[event] === 'undefined') {
			self.events[event] = [];
		}

		self.events[event].push(callback);

		return self;
	};

	EventEmitter.prototype.off = function(event, callback) {
		var self = this;

		if (callback === undefined) {
			throw new Error("You must specify both an event and a callback to switch off. To switch off all callbacks for this event, try allOff()");
		}

		if(typeof self.events[event] !== 'undefined') {
			forEach(self.events[event], function(v, k) {
				if (v === callback) {
					delete self.events[event][v];
					return self;
				}
			});
		}
		else {
			throw new Error("No such event");
		}
	};

	EventEmitter.prototype.allOff = function(event) {
		var self = this;

		if(typeof self.events[event] !== 'undefined') {
			delete self.events[event];
		}
		else {
			throw new Error("No such event");
		}

		return self;
	};

	return EventEmitter;
});