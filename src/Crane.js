(function() {
	var global = (function() { return this; }).call();

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
	};

	var EventEmitter = function(func) {
		this.events = {};
		this.func = func;
		return this;
	}

	EventEmitter.prototype.emit = function(event, param) {
		var self = this;
		forEach(self.events, function(v, k) {
			if (k === event) {
				forEach(self.events[k], function(v, k) {
					v(param);
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

	var CraneModel = function(name, model) {
		var Model = function(name, model) {
			console.log("Creating " + name + " model.");
			var self = this;
			var crane = global.Crane;
			var props = {};
			var setters = [];
			var getters = [];

			forEach(model, function(v, p) {
				if (typeof model[p] != 'function') {
					props["_"+p] = model[p];

					getters["_"+p] = new EventEmitter(function() {
						this.emit("getter", p);
					}).on('getter', function() {
						self.emit("getter", p);
					});
					setters["_"+p] = new EventEmitter(function() {
						this.emit("setter", p);
					}).on('setter', function() {
						self.emit("setter", p);
					});

					self.__defineGetter__(p, function() {
						getters["_"+p].func();
						return props["_"+p];
					});
					self.__defineSetter__(p, function(val) {
						props["_"+p] = val;
						setters["_"+p].func();
					});
				}
			});

			var doModelBindings = function() {
				if (crane.bindings[name]) {
					var modelBinding = crane.bindings[name];
					for(property in modelBinding) {
						if (props["_"+property] !== undefined) {
							var bindees = modelBinding[property];
							forEach(bindees, function(v, k) {
								crane.createDOMBinding(v, self);
							});
						}
						else {
							throw new Error("Tried to bind to property: " + property + ", but it doesn't exist in the Model.");
						}
					}
				}
			}

			if (crane.madeBindings) {
				doModelBindings();
			}
			else {
				crane.addPostBindingCallback(doModelBindings);
			}
		};

		Model.prototype = new EventEmitter();

		return (function(name, model) {
			return function () {
				return new Model(name, model);
			}
		})(name, model);
	};

	var Crane = function() {
		var self = this;

		this.bindings = [];
		this.postBindingCallbacks = [];
		this.callAfterBinding = null;
		this.madeBindings = false;
		this.model = CraneModel;

		this.postLoadBindings = function() {
			var bindings = document.querySelectorAll("[data-Crane]");

			for (var b = 0, len = bindings.length; b < len; b++) {
				var binding = bindings[b];
				var bindingArray = binding.dataset.crane.split('.');
				var model = bindingArray[0];
				var property = bindingArray[1];
				if (!self.bindings[model]) { self.bindings[model] = []; }
				if (!self.bindings[model][property]) { self.bindings[model][property] = []; }
				self.bindings[model][property].push(binding);
			}

			self.madeBindings = true;

			for (var c = 0, len = self.postBindingCallbacks.length; c < len; c++) {
				self.postBindingCallbacks[c]();
			}

			if (self.callAfterBinding) { self.callAfterBinding(); }
		};

		if (global.craneRunners.length > 0) {
			global.Crane.postLoadBindings();
			for (var c = 0, len = global.craneRunners.length; c < len; c++) {
				global.craneRunners[c]();
			}
		}
		else {
			document.addEventListener('DOMContentLoaded', this.postLoadBindings);
		}
	}

	Crane.prototype.run = function(func) {
		if (this.madeBindings) {
			func();
		}
		else {
			this.callAfterBinding = func;
		}
	};

	Crane.prototype.addPostBindingCallback = function(func) {
		this.postBindingCallbacks.push(func);
	};

	Crane.prototype.createDOMBinding = function(element, model) {
		model.on('getter', function(property) {
			//console.log("getter called on model property: " + property + ", update: " + element);
		});
		model.on('setter', function(property) {
			//console.log("setter called on model property: " + property + ", update: " + element);
			if (element.nodeName.toLowerCase() !== 'input') {
				element.innerHTML = element.innerText = model[property];
			}
		});

		if (element.nodeName.toLowerCase() === 'input') {
			element.addEventListener('keyup', function(event) {
				model[property] = element.value;
			});
		}
	};

	global.Crane = new Crane();
})();
