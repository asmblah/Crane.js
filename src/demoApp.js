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
					"key" : "value" //Not watchable due to parent.
				}) //Not watchable
			},
			"subModel" : Crane.model("BankAccount",
			{
				"number" : -1, //watchable
				"type" : "" //watchable
			}), //Internally new'd
			"subNewedModel" : new Crane.model("Thing",
			{
				"number" : -1, //watchable
				"string" : "hello" //watchable
			})(),
			"subNewedModelWithSubNewedModel" : new Crane.model("OtherThing",
			{
				"number" : -1, //watchable
				"subSubNewedModel" : new Crane.model("SubOtherThing", {
					"number" : -1, //watchable
					"string" : "there" //watchable
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