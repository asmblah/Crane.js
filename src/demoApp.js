(function() {
	var global = (function() { return this; }).call();

	var main = function() {
		var User = Crane.model("User",
		{
			"firstName" : "", //Watchable.
			"lastName" : "", //Watchable.
			"fullName" : function() {
				return this.firstName + " " + this.lastName;
			}, //Watchable
			"funcInFunc" : function() {
				var self = this;
				var x = this.firstName;
				var res = (function() {
					return self.firstName + " beans " + self.lastName;
				})(); //Not watchable.
				return res;
			}, //Watchable
			"subObjectWithProperties" : {
				"objProp" : "" //Not watchable.
			},
			"subObjectOfModels" : {
				"modelProp" : Crane.model("Stuff",
				{
					"key" : "value" //watchable
				})
			},
			"subModel" : Crane.model("BankAccount",
			{
				"number" : -1, //watchable
				"type" : "" //watchable
			}), //Not watchable
			"subNewedModel" : new Crane.model("Thing",
			{
				"number" : -1,
				"string" : "hello"
			})(),
			"subNewedModelWithSubNewedModel" : new Crane.model("OtherThing",
			{
				"number" : -1,
				"subSubNewedModel" : new Crane.model("SubOtherThing", {
					"number" : -1,
					"string" : "there"
				})()
			})(),
			"subArrayOfValues" : [
				1,2,3,4
			], //Watchable
			"subArrayOfObjects" : [
				{
					"key" : "value" //Not watchable.
				} //Not watchable
			], //Watchable
			"subArrayOfModels" : [
				Crane.model("Favourite",
				{
					"name" : "", //Watchable
					"uri" : "" //Watchable
				})
			]
		});

		var usr = new User();
	};

	if (global.Crane === undefined) {
		global.craneRunners.push(main);
	}
	else {
		global.Crane.run(main);
	}
})();