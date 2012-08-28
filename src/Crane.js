define(["../ext/WatchedArray/src/WatchedArray", "../ext/EventEmitter/src/EventEmitter", "../ext/forEach/src/forEach", "../ext/JSArgCheck/src/JSArgCheck"], function(WArray, EventEmitter, forEach, JSArgCheck) {
	var global = (function() { return this; }).call();

	var isNumber = function(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	};

	var PropertyStack = function PropertyStack(parentPropStack) {
		var stack = [];
		var parentStack = false;

		if (parentPropStack !== undefined) {
			parentStack = true;
			var pStack = parentPropStack.getStack();
			for(var p = 0, len = pStack.length; p < len; p++) {
				stack.push(pStack[p]);
			}
		}

		this.toString = function() {
			var sString = "";
			for(var s = 0, len = stack.length; s < len; s++) {
				var sObj = stack[s];
				sString += (isNumber(sObj)) ? "[" + sObj + "]" : "." + sObj;
			}
			return sString.replace(/^\.*/, '');
		};

		this.addPropertyName = function(propName) {
			if (!parentStack) {
				if (stack[0] !== propName) {
					if (!isNumber(propName)) {
						stack = [propName];
					}
					else {
						stack.push(propName);
					}
				}
			}
			else {
				stack.push(propName);
			}
		};

		this.getStack = function() {
			return stack;
		}
	};

	var Model = function Model(name, definition, parent) {
		this.constructor();
		var self = this;

		self.name = name;
		self.notifiers = {};
		self.propertyStack = new PropertyStack((parent !== undefined) ? parent.propertyStack : undefined);

		//Iterate definition properties.
		forEach(definition, function(v, k) {
			var defineSettersAndGetters = function(propValue, propKey, isWArray) {
				self.propertyStack.addPropertyName(propKey);
				var closuredValue = propValue;
				var propertyStackValue = self.propertyStack.toString();

				self.__defineGetter__(propKey, function() {
					return closuredValue;
				});

				if (typeof closuredValue === "object") {
					if (closuredValue.length === undefined) {
						closuredValue = new Model(propKey, closuredValue, self);
					}
					else {
						var w = new WArray(closuredValue);
						for (var a = 0, arrayLength = w.length; a < arrayLength; a++) {
							var arrayElement = w[a];
							w[a] = defineSettersAndGetters(arrayElement, a, w);
						}
						closuredValue = w;
						closuredValue.on('set', function(propName, propValue) {
							self.emit('set', propertyStackValue + "[" + propName + "]", propValue);
						});
						closuredValue.on('push', function(propName, propValue) {
							self.emit('set', propertyStackValue, propValue);
						});
					}
				}

				(function() {
					var closuredSelf = self;
					self.__defineSetter__(propKey, function(val) {
						closuredValue = val;
						defineSettersAndGetters(closuredValue, propKey);
						self.emit('set', propertyStackValue, closuredValue);
					});
				})();

				return closuredValue;
			};
			defineSettersAndGetters(v, k);
		});

		self.on('set', function(propName, propValue) {
			if (parent !== undefined) {
				parent.emit('set', propName, propValue);
			}
			else if (self.notifiers[propName] !== undefined) {
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
	};

	global.crane = new Crane();
});