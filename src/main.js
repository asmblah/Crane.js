require(["Crane.js", "../ext/t.js/src/t.js"], function() {
	var global = (function() { return this; }).call();
	var userModel;
	var User = Crane.model("User",
	{
		"firstName" : "Hello", //Watchable.
		"lastName" : "World", //Watchable.
		"fullName" : function() {
			return this.firstName + " " + this.lastName;
		}, //Watchable
		"funcInFunc" : function() {
			var self = this;
			var x = this.firstName;
			var res = (function() {
				return x + " there " + self.lastName;
			})(); //Not watchable.
			return res;
		}, //Watchable
		"subObjectWithProperties" : {
			"objProp" : "ello" //Watchable.
		},
		"subObjectOfModels" : {
			"modelProp" : Crane.model("Stuff",
			{
				"key" : "value" //Not watchable due to parent.
			}) //Not watchable
		},
		"subModel" : Crane.model("BankAccount",
		{
			"number" : 99, //watchable
			"type" : "" //watchable
		}), //Internally new'd
		"subNewedModel" : new Crane.model("Thing",
		{
			"number" : 101, //watchable
			"string" : "hello" //watchable
		})(),
		"subNewedModelWithSubNewedModel" : new Crane.model("OtherThing",
		{
			"number" : 1101, //watchable
			"subSubNewedModel" : new Crane.model("SubOtherThing", {
				"number" : 2202, //watchable
				"string" : "there" //watchable
			})()
		})(),
		"subArrayOfValues" : [
			0, //Watchable
			1, //Watchable
			0, //Watchable
			1 //Watchable
		], //Watchable
		"funcWithArray" : function() {
			return this.subArrayOfValues.join(':');
		}, //Watchable
		"subArrayOfObjects" : [
			{
				"key" : "value" //Not watchable.
			} //Not watchable
		], //Watchable
		"arrayOfObjects" : [
			{
				"label" : "Gluten",
				"_value" : "gln",
				"checked" : "false"
			}
			,
			{
				"label" : "Fructose",
				"_value" : "frt",
				"checked" : "true"
			}
		],
		"subArrayOfModels" : [
			Crane.model("Favourite",
			{
				"name" : "", //Watchable
				"uri" : "" //Watchable
			})
		]
	});
	userModel = new User();

	var models = {
		"User" : userModel
	};

	new global.t(models);

	Crane.applyBindings();

	global.userModel = userModel;
});