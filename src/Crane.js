(function() {
	var global = (function() { return this; }).call();

	var forEach = function(a,c) {
		var p;
		for(p in a) {
			if(a.hasOwnProperty(p)) { c(p); }
		}
	}, extend = function (to, from) {
		forEach(from, function(p) { to[p] = from[p]; });
		return to;
	};

	Crane = function() {
		this.models = [];
		this.bindings = [];
		console.log("new Crane");
	}

	CraneModel = function() {
		this.get = function() {};
	}

	Crane.prototype.ready = function(models, init)
	{
		var bindings = document.querySelectorAll("[data-Crane]");

		for (var b = 0, len = bindings.length; b < len; b++) {
			var binding = bindings[b];
			var bindingArray = binding.dataset.crane.split('.');
			var model = bindingArray[0];
			var property = bindingArray[1];
			if (!this.bindings[model]) { this.bindings[model] = []; }
			if (!this.bindings[model][property]) { this.bindings[model][property] = []; }
			this.bindings[model][property].push(binding);
		}

		for (var m = 0, modelLength = models.length; m < modelLength; m++) {
			var model = models[m];
			this.models[model.name] = model.model;
			if (this.bindings[model.name]) {
				for(property in this.bindings[model.name]) {
					for (var b = 0, bindingLength = this.bindings[model.name][property].length; b < bindingLength; b++) {
						var binding = this.bindings[model.name][property][b];
						this.createBinding(binding, model, property);
					}
				}
			}
		}

		init(models[0].replace);
	};

	Crane.prototype.createBinding = function(bindTo, model, property) {
		model.replace = function() {
			extend(this, new CraneModel);
			extend(this, model.model);
		};
	}

	global.Crane = new Crane();
})();