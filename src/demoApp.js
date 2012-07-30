(function() {
	var User = function() {
		this.username = "";
	}

	function domLoaded() {
		console.log("Dom loaded");
		Crane.ready([{"name" : "User", "model" : User}]);
	};

	document.addEventListener('DOMContentLoaded', domLoaded);
})();