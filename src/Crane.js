define(["../ext/WatchedArray/src/WatchedArray", "../ext/EventEmitter/src/EventEmitter", "forEach"], function(WArray, EventEmitter, forEach) {
	var global = (function() { return this; }).call();

	var CraneModel = function(name, model) {
		var Model = function(name, model) {
			console.log("Creating " + name + " model.");
			var self = this;
			var crane = global.Crane;
			var props = [];
			var funcs = [];
			var models = [];
			var setters = [];
			var getters = [];

			crane.addModel(self);

			var x = new WArray();

			this.hasProperty = function(propertyName) {
				return (props["_"+propertyName]!==undefined);
			};

			var parsePropertyDefinition = function(propertyDefinition, propertyName) {
				props["_"+propertyName] = propertyDefinition;

				getters["_"+propertyName] = new EventEmitter(function() {
					this.emit("getter", propertyName);
				}).on('getter', function() {
					self.emit("getter", propertyName);
				});
				setters["_"+propertyName] = new EventEmitter(function() {
					this.emit("setter", propertyName);
				}).on('setter', function() {
					self.emit("setter", propertyName);
				});

				self.__defineGetter__(propertyName, function() {
					getters["_"+propertyName].func();
					return props["_"+propertyName];
				});
				self.__defineSetter__(propertyName, function(val) {
					props["_"+propertyName] = val;
					setters["_"+propertyName].func();
				});
			};

			var parseFunctionDefinition = function(functionDefinition, propertyName) {
				var functionParameters = crane.getFunctionParams(functionDefinition);
				var assignmentRegex = /(=\s*this[;|\r|\n])|(=\s?this$)/g;
				if (assignmentRegex.test(functionDefinition)) {
					for (var prop in props) {
						var propRegex = /_(.+)/g;
						var res = propRegex.exec(prop);
						if (functionParameters.indexOf(res[1]) == -1) {
							functionParameters.push(res[1]);
						}
					}
				}
				var Context = function() {};
				for(var r = 0, paramCount = functionParameters.length; r < paramCount; r++) {
					var param = functionParameters[r];
					setters["_"+param].on('setter', function() {
						var ret = funcs["_"+propertyName]();
						self[propertyName] = ret;
						self.emit('setter', propertyName);
						delete self[propertyName];
					});
				}
				funcs["_"+propertyName] = function() {
					var context = new Context();
					for(var r = 0, paramCount = functionParameters.length; r < paramCount; r++) {
						var param = functionParameters[r];
						context[param] = props["_"+param];
					}
					return functionDefinition.apply(context);
				};
			};

			var parseModelDefinition = function(modelDefinition, propertyName) {
				models["_"+propertyName] = modelDefinition;
			};

			forEach(model, function(v, p) {
				if (typeof model[p] != 'function' && typeof model[p] != 'object') {
					console.log(p + " is a property");
					parsePropertyDefinition(model[p], p);
				}
				else if (typeof model[p].prototype !== "undefined") {
					//Function definition.
					if (crane.functionDefinitionIsModel(model[p])) {
						console.log(p + " is a Model definition");
						//Can't have just a Model definition, it needs to be an instance.
						model[p] = new model[p]();
						parseModelDefinition(model[p], p);
					}
					else {
						console.log(p + " is a Function definition");
						parseFunctionDefinition(model[p], p);
					}
				}
				else if (model[p] instanceof EventEmitter) {
					if (crane.hasModel(model[p])) {
						console.log(p + " is an instance of a Model");
						parseModelDefinition(model[p], p);
					}
					else {
						console.log(p + " is an instance of an EventEmitter");
					}
				}
				else if (typeof model[p].length !== "undefined") {
					//Array.
					console.log(p + " is an Array");
					parsePropertyDefinition(model[p], p);
				}
				else {
					console.log(p + " is an Object");
				}
			});

			var doModelBindings = function() {
				if (crane.bindings[name]) {
					var modelBinding = crane.bindings[name];
					for(var property in modelBinding) {
						var boundProperty = false;
						if (property.indexOf('.') !== -1) {
							//Sub property.
							var splitProperties = property.split('.');
							var previousModel = null;
							forEach(splitProperties, function(v, k) {
								if (models["_"+v] !== undefined) {
									previousModel = models["_"+v];
								}
								else {
									if (previousModel !== null) {
										if (previousModel.hasProperty(v)) {
											boundProperty = true;
											var bindees = modelBinding[property];
											forEach(bindees, function(bindee, k) {
												crane.createDOMBinding(bindee, previousModel, v);
											});
										}
									}
									else {
										if (v === splitProperties[0]) {
											throw new Error("Tried to bind to property: " + property + ", but the parent property: " + v + " is not a Model");
										}
										else {
											throw new Error("Tried to bind to property: " + v + ", but it is a sub property of an object that is not a Model.");
										}
									}
								}
							});
						}

						if (props["_"+property] !== undefined) {
							boundProperty = true;
							var bindees = modelBinding[property];
							forEach(bindees, function(v, k) {
								crane.createDOMBinding(v, self, property);
							});
						}
						else if (funcs["_"+property] !== undefined) {
							boundProperty = true;
							var bindees = modelBinding[property];
							forEach(bindees, function(v, k) {
								crane.createDOMBinding(v, self, property);
							});
						}
						
						if (!boundProperty) {
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

		this.models = [];
		this.bindings = [];
		this.postBindingCallbacks = [];
		this.callAfterBinding = null;
		this.madeBindings = false;
		this.model = CraneModel;

		this.postLoadBindings = (function() {
			var bindings = document.querySelectorAll("[data-Crane]");

			for (var b = 0, len = bindings.length; b < len; b++) {
				var binding = bindings[b];
				var bindingArray = binding.dataset.crane.split('.');
				var model = bindingArray[0];
				delete bindingArray[0];
				var property = bindingArray.join('.').replace(/^\./, '');
				if (!self.bindings[model]) { self.bindings[model] = []; }
				if (!self.bindings[model][property]) { self.bindings[model][property] = []; }
				self.bindings[model][property].push(binding);
			}

			self.madeBindings = true;

			for (var c = 0, len = self.postBindingCallbacks.length; c < len; c++) {
				self.postBindingCallbacks[c]();
			}

			if (self.callAfterBinding) { self.callAfterBinding(); }
		})();
	};

	Crane.prototype.addModel = function(model) {
		this.models.push(model);
	};

	Crane.prototype.hasModel = function(model) {
		var haveModel = false;
		forEach(this.models, function(v, k) {
			if (v === model) { haveModel = true; }
		});

		return haveModel;
	};

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

	Crane.prototype.createDOMBinding = function(element, model, bindProperty) {
		model.on('getter', function(property) {
			//console.log("getter called on model property: " + property + ", update: " + element);
		});
		model.on('setter', function(property) {
			//console.log("setter called on model property: " + property + ", update: " + element);
			if (property !== bindProperty) { return; }
			if (element.nodeName.toLowerCase() !== 'input') {
				element.innerHTML = element.innerText = model[property];
			}
		});

		if (element.nodeName.toLowerCase() === 'input') {
			element.addEventListener('keyup', function(event) {
				model[bindProperty] = element.value;
			});
		}
		else {
			element.innerHTML = element.innerText = model[bindProperty];
		}
	};

	Crane.prototype.getFunctionParams = function(functionDefinition) {
		var funcDefString = functionDefinition.toString();
		funcDefString = funcDefString.replace(/\n|\t/g, ' ').replace(/\s+/g, ' ');
		var paramRegex = /this\.([a-zA-Z]+[0-9]*)+/g;
		var match;
		var functionParameters = [];
		while ((match = paramRegex.exec(funcDefString)) != null) {
			functionParameters.push(match[1]);
		}
		return functionParameters;
	};

	Crane.prototype.functionDefinitionIsModel = function(functionDefinition) {
		return functionDefinition.toString() === (CraneModel({})).toString();
	};

	global.Crane = new Crane();
});
