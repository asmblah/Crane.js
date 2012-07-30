(function() {
	var User = function() {
		this.username = "";
	}

	function domLoaded() {
		console.log("Dom loaded");
		Crane.ready([{"name" : "User", "model" : new User, "origin" : User}], function(newUser) {
			User = newUser;
		});
	};

	document.addEventListener('DOMContentLoaded', domLoaded);
})();