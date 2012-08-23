require(["../src/Crane.js"], function() {
	describe('Crane', function() {
		var modelDef = {
			firstName : "John",
			lastName : "Doe",
			favouriteFoods : [
				"Chocolate", "Bacon", "Cheese"
			]
		};
		var craneModel;

		before(function(){
			craneModel = new (Crane.model("Person", modelDef))();
			console.log(craneModel);
		});

		describe('Model', function() {
			describe('#name', function() {
				it('name should be "Person"', function() {
					should.exist(craneModel.name);
					craneModel.name.should.be.a('string');
					craneModel.name.should.equal("Person");
				});
			});
		});

		describe('Properties', function(){
			describe('#firstName', function(){
				it('should return "John"', function(){
					craneModel.firstName.should.be.a('string');
					craneModel.firstName.should.equal("John");
				});
			});
			describe('#lastName', function(){
				it('should return "Doe"', function(){
					craneModel.lastName.should.be.a('string');
					craneModel.lastName.should.equal("Doe");
				});
			});
			describe('#favouriteFoods', function(){
				it('should have a length of 3', function(){
					craneModel.favouriteFoods.length.should.equal(3);
				});
			});
		});
	});
	mocha.run();
});
