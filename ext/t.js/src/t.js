define(function() {
	var global = (function() { return this; }).call();
	var trim = function(text) {
		return text.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
	};

	var t = function(models) {
		var self = this;
		(function () {
			var templates = document.querySelectorAll("script[type='text/html']");
			for (var t = 0, templatesLength = templates.length; t < templatesLength; t++) {
				var template = templates[t];
				var renderType = template.dataset["tRendertype"];
				var innerTemplates = self.extractTemplates(template);
				self.runTemplates(innerTemplates, models, renderType, template);
				template.parentNode.removeChild(template);
			}
		})();
	};

	t.prototype.extractTemplates = function(template) {
		var self = this;
		var templateText = template.innerHTML.replace(/\n|\t/g, ' ').replace(/\s+/g, ' ')
		templateText = templateText.replace(/\( </g, '(<').replace(/\] \(/g, '](').replace(/> \)/g,'>)');
		templateText =  trim(templateText);
		var innerTemplates = templateText.split(');');
		if (innerTemplates[innerTemplates.length-1] === "") { innerTemplates.length = innerTemplates.length-1; }
		for (var t = 0, templatesLength = innerTemplates.length; t < templatesLength; t++) {
			innerTemplates[t] += ")";
		}
		return innerTemplates;
	};

	t.prototype.runTemplates = function(templates, models, renderType, templateElement) {
		var self = this;
		var modelPropertyRegexSample = '^([a-zA-Z0-9\\.]+)[\\s]*\\(';
		var templateContentRegexSample = '^[a-zA-Z0-9\\.]+[\\s]*\\((.*)\\)';
		for (var t = 0, templatesLength = templates.length; t < templatesLength; t++) {
			var template = templates[t];
			var modelPropertyRegex = new RegExp(modelPropertyRegexSample);
			if (modelPropertyRegex.test(template)) {
				var modelPropertyTree = modelPropertyRegex.exec(template)[1];
				modelPropertyTree = modelPropertyTree.split('.');
				var model = modelPropertyTree[0];
				delete modelPropertyTree[0];
				var propertyTree = modelPropertyTree.join('.').replace(/^\./, '');
				if (models[model]) {
					var templateContentRegex = new RegExp(templateContentRegexSample);
					if (templateContentRegex.test(template)) {
						var templateContent = templateContentRegex.exec(template)[1];
						if (propertyTree.indexOf('.') !== -1) {
							//Sub-property binding.
							throw new Error("Sub property binding not supported yet.");
						}
						else {
							//Top-property binding.
							self.renderTemplate(models[model][propertyTree], templateContent, renderType, templateElement);
						}
					}
				}
			}
		}
	};

	t.prototype.renderTemplate = function(property, template, renderType, templateElement) {
		var self = this;
		var ternaryRegexSample = '{{(\\((.+)\\)\\s?\\?\\s?"([a-zA-Z0-9]*)"\\s?:\\s?"([a-zA-Z0-9]*)"\\s?)}}';
		var castRegexSample = '(cast\\(([^\\)|.]*)\\))';
		var logicRegexSample = '<|>|==|!=';
		var div = document.createElement('div');
		div.innerHTML = "";
		if (property.length !== undefined) {
			for (var p = 0, propertyLength = property.length; p < propertyLength; p++) {
				var renderedTemplate = template;
				var propertyValue = property[p];
				//First pass. Replace key with key, value with value.
				renderedTemplate = renderedTemplate.replace('{{key}}', p).replace('{{value}}', propertyValue);
				
				//Replace all properties of the propertyValue.
				for (valueProperty in propertyValue) {
					var replacementName = '{{' + valueProperty + '}}';
					if (renderedTemplate.indexOf(replacementName) !== -1) {
						renderedTemplate = renderedTemplate.replace(replacementName, propertyValue[valueProperty]);
					}
				}

				//Check for any casts.
				var castRegex = new RegExp(castRegexSample);
				if (castRegex.test(renderedTemplate)) {
					var castRegexExec = castRegex.exec(renderedTemplate);
					var fullCast = castRegexExec[1];
					var cast = castRegexExec[2];
					var castSplit = cast.split(',');
					var castType = castSplit[0];
					var castValue = trim(castSplit[1]);

					if (propertyValue[castValue] !== undefined) {
						var currentValue = propertyValue[castValue];
						var newValue = null;
						switch (castType) {
							case "!!":
								newValue = (currentValue.toLowerCase() === 'true');
							break;
							default:
								throw new Error("Cast is a complex cast that I cannot process.");
							break;
						}
						renderedTemplate = renderedTemplate.replace(castRegex, newValue);
					}
				}

				//Check for any ternaries.
				var ternaryRegex = new RegExp(ternaryRegexSample);
				if (ternaryRegex.test(renderedTemplate)) {
					var ternaryRegexExec = ternaryRegex.exec(renderedTemplate);
					var fullTernary = ternaryRegexExec[1];
					var ternaryTest = ternaryRegexExec[2];
					var trueOut = ternaryRegexExec[3];
					var falseOut = ternaryRegexExec[4];
					var logicRegex = new RegExp(logicRegexSample);
					if (ternaryTest === "true" || ternaryTest === "false") {
						//Simple eval.
						var result = (currentValue.toLowerCase() === 'true') ? trueOut : falseOut;
						renderedTemplate = renderedTemplate.replace(ternaryRegex, result);
					}
					else if(logicRegex.test(ternaryTest)) {
						throw new Error("Ternary is a complex test that I cannot process.");
					}
				}
				
				div.innerHTML += renderedTemplate;
			}
		}

		div.normalize();

		switch (renderType) {
			case "self":
				while (div.childNodes.length > 0) {
					var childNode = div.childNodes[div.childNodes.length-1];
					templateElement.parentNode.insertBefore(childNode, templateElement.nextSibling);
				}
			break;
		}
	};

	global.t = t;
});
