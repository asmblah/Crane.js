require(["Crane.js", "../ext/t.js/src/t.js"], function() {
	var model = crane.model("User", {
		firstName: "Frank"
	})();

	model.notify("firstName", function (value) {
		document.getElementById("notified").innerHTML = "Yes :) - with '" + value + "'!";
	});

	model.firstName = "Fred";
});
