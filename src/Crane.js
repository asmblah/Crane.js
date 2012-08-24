define(["../ext/WatchedArray/src/WatchedArray", "../ext/EventEmitter/src/EventEmitter", "../ext/forEach/src/forEach", "../ext/JSArgCheck/src/JSArgCheck"], function(WArray, EventEmitter, forEach, JSArgCheck) {
	var global = (function() { return this; }).call();

	var Model = function Model(name, definition) {
		this.constructor();
		var self = this;

		self.name = name;
		self.notifiers = {};

		//Iterate definition properties.
		forEach(definition, function(v, k) {
			var defineSettersAndGetters = function(propValue, propKey, isWArray) {
				var closuredValue = propValue;

				(function() {
					var closuredSelf = self;
					self.__defineGetter__(propKey, function() {
						return closuredValue;
					});
				})();

				if (typeof closuredValue === "object") {
					if (closuredValue.length === undefined) {
						closuredValue = new Model(propKey, closuredValue);
						closuredValue.on('set', function(propName, propValue) {
							self.emit('set', propKey + "." + propName, propValue);
						});
					}
					else {
						var w = new WArray(closuredValue);
						for (var a = 0, arrayLength = w.length; a < arrayLength; a++) {
							var arrayElement = w[a];
							defineSettersAndGetters(arrayElement, a, w);
							if (w[a] instanceof Model) {
								(function() {
									var closuredCount = a;
									w[a].on('set', function(propName, propValue) {
										self.emit('set', propKey + "[" + closuredCount + "]." + propName, propValue);
									});
								})();
							}
						}
						closuredValue = w;
						closuredValue.on('set', function(propName, propValue) {
							self.emit('set', propKey + "[" + propName + "]", propValue);
						});
						closuredValue.on('push', function(propName, propValue) {
							self.emit('set', propKey, propValue);
						});
					}
				}

				if (isWArray !== undefined) {
					isWArray[propKey] = closuredValue;
				}

				(function() {
					var closuredSelf = self;
					self.__defineSetter__(propKey, function(val) {
						closuredValue = val;
						defineSettersAndGetters(closuredValue, propKey);
						closuredSelf.emit('set', propKey, closuredValue);
					});
				})();
			}
			defineSettersAndGetters(v, k);
		});

		self.on('set', function(propName, propValue) {
			console.log(propName + " was set to: " + propValue);
			if (self.notifiers[propName] !== undefined) {
				forEach(self.notifiers[propName], function(v, k) {
					v(propValue);
				});
			}
		});
	};

	Model.prototype = Object.create(EventEmitter.prototype);

	Model.prototype.notify = function(notifyFor, callback) {
		var self = this;

		if (typeof notifyFor === "string") {
			notifyFor = [notifyFor];
		}

		forEach(notifyFor, function(v, k) {
			if(typeof self.notifiers[v] === 'undefined') {
				self.notifiers[v] = [];
			}

			self.notifiers[v].push(callback);
		});
	};

	Model.prototype.ignore = function(ignoreFor, callback) {
		var self = this;

		if (typeof ignoreFor === "string") {
			ignoreFor = [ignoreFor];

			forEach(ignoreFor, function(v1, k) {
				if(typeof self.notifiers[v1] !== 'undefined') {
					forEach(self.notifiers[v1], function(v2, k) {
						if (v2 === callback) {
							self.notifiers[v1].splice(k, 1);
							return self;
						}
					});
				}
			});
		}
	};

	Model.prototype.ignoreAll = function() {
		var self = this;
		self.notifiers = {};
	};

	var modelWrap = function(modelName, modelDef) {
		JSArgCheck([{ arg: modelName, name : "modelName", type : "string", minLength : 1 }, { arg: modelDef, name : "modelDef", type : "object", minKeys : 1 }]);

		return function() {
			return new Model(modelName, modelDef);
		}
	};

	var Crane = function Crane() {
		this.model = modelWrap;
		this.propertyStack = "";
	};

	global.crane = new Crane();
});