(function() {
	var global = (function() { return this; }).call();

	var main = function() {
		var User = Crane.model("User",
		{
			"username" : "",
			"password" : "",
			"checkPassword" : function(password) {
				console.log("check password");
			}
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