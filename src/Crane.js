(function() {
	var global = (function() { return this; }).call();

	Crane = function() {
		this.models = [];
		this.bindings = [];
		console.log("new Crane");
	}

	Crane.prototype.ready = function(models)
	{
		var bindings = document.querySelectorAll("[data-Crane]");

		for (var b = 0, len = bindings.length; b < len; b++) {
			var binding = bindings[b];
			var bindingArray = binding.dataset.crane.split('.');
			var model = bindingArray[0];
			var property = bindingArray[1];
			if (!this.bindings[model]) { this.bindings[model] = []; }
			if (!this.bindings[model][property]) {
				this.bindings[model].push(property);
			}
		}

		for (var m = 0, len = models.length; m < len; m++) {
			var model = models[m];
			this.models[model.name] = model.model;
			if (this.bindings[model.name]) {
				for (var b = 0, len = this.bindings[model.name].length; b < len; b++) {
					var binding = this.bindings[model.name][b];
					console.log(binding);
				}
			}
		}
	}

	global.Crane = new Crane();
})();