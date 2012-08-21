define(["../ext/WatchedArray/src/WatchedArray", "../ext/EventEmitter/src/EventEmitter", "../ext/forEach/src/forEach"], function(WArray, EventEmitter, forEach) {
	var global = (function() { return this; }).call();

	var CraneModel = function(name, model) {
		var Model = function(name, model) {
			console.log("Creating " + name + " model.");
			var self = this;
			var crane = global.Crane;
			var props = [];
			var funcs = [];
			self.arrays = [];
			self.models = [];
			self.name = name;
			var setters = [];
			var getters = [];

			crane.addModel(self);

			this.hasProperty = function(propertyName) {
				return (props["_"+propertyName]!==undefined);
			};

			this.hasModel = function(modelName) {
				return (self.models["_"+modelName]!==undefined);
			};

			this.notify = function(propertyName, callback) {
				self.on('setter', function(propSet) {
					if (propSet === propertyName) {
						callback(propertyName, model[propertyName]);
					}
				});
			};

			var parsePropertyDefinition = function(propertyDefinition, propertyName) {
				props["_"+propertyName] = propertyDefinition;

				getters["_"+propertyName] = new EventEmitter(function() {
					this.emit("getter", propertyName);
				}).on('getter', function() {
					self.emit("getter", propertyName);
				});
				setters["_"+propertyName] = new EventEmitter(function() {
					this.emit('setter', propertyName);
				}).on('setter', function() {
					self.emit('setter', propertyName, self.name);
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

			var parseArrayDefinition = function(arrayDefinition, propertyName) {
				model[propertyName] = new WArray(arrayDefinition);
				self.arrays["_"+propertyName] = model[propertyName];

				setters["_"+propertyName] = new EventEmitter(function() {
					this.emit('setter', propertyName);
				});
				model[propertyName].on('setter', function() {
					self.emit('setter', propertyName, self.name);
					setters["_"+propertyName].func();
				});

				self.__defineGetter__(propertyName, function() {
					return self.arrays["_"+propertyName];
				});
				self.__defineSetter__(propertyName, function() {
					throw new Error("Cannot set " + propertyName + " as this would destroy all Watchers.");
				});

				var array = model[propertyName];
				for (var a = 0, arrayLength = array.length; a < arrayLength; a++) {
					var arrayProp = array[a];
					if (typeof arrayProp != 'function' && typeof arrayProp != 'object') {
						console.log(propertyName + "[" + a + "] is a property");
					}
					else if (typeof arrayProp.prototype !== "undefined") {
						//Function definition.
						if (crane.functionDefinitionIsModel(arrayProp)) {
							console.log(propertyName + "[" + a + "] is a Model definition");
							//Can't have just a Model definition, it needs to be an instance.
							
						}
						else {
							console.log(propertyName + "[" + a + "] is a Function definition");
							
						}
					}
					else if (arrayProp instanceof EventEmitter) {
						if (crane.hasModel(arrayProp)) {
							console.log(propertyName + "[" + a + "] is an instance of a Model");
							
						}
						else {
							console.log(propertyName + "[" + a + "] is an instance of an EventEmitter");
						}
					}
					else if (typeof arrayProp.length !== "undefined") {
						//Array.
						console.log(propertyName + "[" + a + "] is an Array");
						throw new Error("Can't parse an array in an array");
					}
					else {
						console.log(propertyName + "[" + a + "] is an Object");
						var convertedModel = parseObjectDefinition(arrayProp, propertyName+"["+a+"]", propertyName);
						array[a] = convertedModel;
					}
				}
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
						self.emit('setter', propertyName, self.name);
						delete self[propertyName];
					});
				}
				funcs["_"+propertyName] = function() {
					var context = new Context();
					for(var r = 0, paramCount = functionParameters.length; r < paramCount; r++) {
						var param = functionParameters[r];
						if (props["_"+param] !== undefined) {
							context[param] = props["_"+param];
						}
						else if (self.arrays["_"+param] !== undefined) {
							context[param] = self.arrays["_"+param];
						}
						else if (self.models["_"+param] !== undefined) {
							context[param] = self.models["_"+param];
						}
					}
					return functionDefinition.apply(context);
				};
				self.__defineGetter__(propertyName, function() {
					return funcs["_"+propertyName]();
				});
			};

			var parseModelDefinition = function(modelDefinition, propertyName) {
				self.models["_"+propertyName] = modelDefinition;
			};

			var parseObjectDefinition = function(objectDefinition, propertyName) {
				var convertedModel = new Model(propertyName, objectDefinition);
				self.models["_"+propertyName] = convertedModel;
				return convertedModel;
			};

			var determineDefinitionType = function(model) {
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
						parseArrayDefinition(model[p], p);
					}
					else {
						console.log(p + " is an Object");
						parseObjectDefinition(model[p], p);
					}
				});
			}
			
			determineDefinitionType(model);

			var doModelBindings = function() {
				console.log("Doing model bindings for " + name);
				if (crane.bindings[name]) {
					var modelBinding = crane.bindings[name];
					for(var property in modelBinding) {
						var boundProperty = false;
						if (property.indexOf('.') !== -1) {
							//Sub property.
							var splitProperties = property.split('.');
							var parentProperty = splitProperties[0];
							/*var arrayExpressionRegexSample = '([a-zA-Z0-9]+)\\[([0-9]+)\\]';
							var arrayExpressionRegex = new RegExp(arrayExpressionRegexSample);
							if (arrayExpressionRegex.test(parentProperty)) {
								parentProperty = arrayExpressionRegex.exec(parentProperty)[1];
							}*/
							if (self.models["_"+parentProperty] !== undefined) {
								var previousModel = null;
								forEach(splitProperties, function(v, k) {
									var isBinding = false;
									if (v.indexOf("->") !== -1) {
										//Specifies binding.
										isBinding = true;
										var bindingArray = v.split("->");
										var bindFrom = bindingArray[0];
										var bindTo = bindingArray[1];
										v = bindFrom;
									}
									if (self.models["_"+v] !== undefined) {
										previousModel = self.models["_"+v];
									}
									else {
										if (previousModel !== null) {
											if (previousModel.hasProperty(v)) {
												boundProperty = true;
												if (!isBinding) {
													var bindees = modelBinding[property];
													forEach(bindees, function(bindee, k) {
														crane.createDOMBinding(bindee, previousModel, v);
													});
												}
												else {
													var bindees = modelBinding[property];
													forEach(bindees, function(bindee, k) {
														crane.createDOMBinding(bindee, previousModel, bindFrom, bindTo);
													});
												}
											}
											else if (previousModel.hasModel(v)) {
												previousModel = previousModel.models["_"+v];
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
							else if (self.arrays["_"+parentProperty] !== undefined) {
								var arrayName = parentProperty;
								parentProperty = splitProperties[0];
								if (!arrayExpressionRegex.test(parentProperty)) {
									throw new Error("Tried to bind to property: " + property + ", but you did not provide an array accessor");
								}
								var arrayAccessor = arrayExpressionRegex.exec(parentProperty)[2];
								splitProperties = splitProperties.slice(1);
								if (splitProperties.length > 1) {
									throw new Error("Property tree too deep. Not yet implemented.");
								}
								if (splitProperties[0].indexOf("->") !== -1) {
									//Specifies binding.
									var bindingArray = splitProperties[0].split("->");
									var bindFrom = bindingArray[0];
									var bindTo = bindingArray[1];
								}
								else {
									//Unspecified binding.
								}
								console.log(self.arrays["_"+arrayName]);
							}
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
						else if (self.arrays["_"+property] !== undefined) {
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
				else {
					console.log("No bindings for model");
				}
			}
			crane.addModelBindingCallback({ 'name' : name, callback : doModelBindings });
			if (crane.madeBindings) {
				doModelBindings();
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
		this.modelBindingCallbacks = {};
		this.postBindingCallbacks = [];
		this.callAfterBinding = null;
		this.madeBindings = false;
		this.model = CraneModel;

		self.findBindings();
		for (var c = 0, len = self.postBindingCallbacks.length; c < len; c++) {
			self.postBindingCallbacks[c]();
		}

		if (self.callAfterBinding) { self.callAfterBinding(); }
	};

	Crane.prototype.findBindings = function() {
		var self = this;

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
	};

	Crane.prototype.addModelBindingCallback = function(modelCallback) {
		var self = this;
		self.modelBindingCallbacks[modelCallback.name] = modelCallback.callback;
	};

	Crane.prototype.applyBindings = function() {
		var self = this;
		self.findBindings();
		
		for (var m = 0, modelLength = self.models.length; m < modelLength; m++) {
			var model = self.models[m];
			self.modelBindingCallbacks[model.name]();
		}
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

	Crane.prototype.createDOMBinding = function(element, model, bindProperty, bindTo) {
		var self = this;
		model.on('getter', function(property) {
			//console.log("getter called on model property: " + property + ", update: " + element);
		});
		model.on('setter', function(property, modelName) {
			if (modelName === model.name || modelName.indexOf(bindProperty) !== -1) {
				//console.log("setter called on model property: " + property + ", update: " + element);
				//if (property !== bindProperty) { return; }
				if (element.nodeName.toLowerCase() !== 'input') {
					element.innerHTML = self.getPropertyHTML(model[bindProperty], bindProperty);
				}
				else {
					if (element.type === 'text') {
						element.value = model[bindProperty];
					}
					else if(element.type === 'checkbox') {
						element.checked = model[bindProperty];
					}
				}
			}
		});

		if (bindTo === undefined) {
			if (element.nodeName.toLowerCase() === 'input') {
				element.addEventListener('keyup', function(event) {
					model[bindProperty] = element.value;
				});
				if (element.type === 'text') {
					element.value = model[bindProperty];
				}
			}
			else {
				element.innerHTML = self.getPropertyHTML(model[bindProperty], bindProperty);
			}
		}
		else {
			if (bindTo.toLowerCase() === 'checked') {
				element.addEventListener('mouseup', function(event) {
					setTimeout(function() {
						model[bindProperty] = element.checked;
					},10);
				});
			}
		}
	};

	Crane.prototype.getPropertyHTML = function(property, name) {
		var html = '';
		if (typeof property === 'object' && property.length !== undefined) {
			var array = property;
			html = name + ":<br />";
			for (var a = 0, arrayLength = array.length; a < arrayLength; a++) {
				var arrayProp = array[a];
				html += JSON.stringify(arrayProp) + "<br />";
			}
		}
		else {
			html = property;
		}

		return html;
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
