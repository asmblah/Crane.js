require(["../src/Crane.js"], function() {
	describe('Crane.js', function() {
		var modelDef = {
			firstName : "John",
			lastName : "Doe",
			favouriteFoods : [
				"Chocolate", "Bacon", "Cheese"
			],
			favouriteThing : {
				looksLike : "food"
			},
			favouritePlaces : [
				{
					name : "Hull"
				}
			],
			favouriteStuff : [
				[
					{ is : "Book" }
				]
			]
		};
		var craneModel;

		before(function(){
			var cModel = crane.model("Person", modelDef);
			craneModel = new cModel();
		});

		afterEach(function() {
			craneModel.ignoreAll();
		});

		describe('Model', function() {
			it('should require a name.', function() {
				var fn = function() {
					new (crane.model(modelDef))();
				}

				expect(fn).to.throw("modelName does not match type");
			});

			it('should require a definition.', function() {
				var fn = function() {
					new (crane.model("Person"))();
				}

				expect(fn).to.throw("Missing argument: modelDef");
			});

			it('should require a name and a definition.', function() {
				var fn = function() {
					new (crane.model())();
				}

				expect(fn).to.throw("Missing argument: modelName");
			});

			it('should require name to be a string.', function() {
				var fn = function() {
					new (crane.model([],{}))();
				}

				expect(fn).to.throw("modelName does not match type");
			});

			it('should require name not be blank.', function() {
				var fn = function() {
					new (crane.model("",{}))();
				}

				expect(fn).to.throw("modelName does not meet minimum length");
			});

			it('should require definition to be an object.', function() {
				var fn = function() {
					new (crane.model("Person",""))();
				}

				expect(fn).to.throw("modelDef does not match type");
			});

			it('should require definition to have at least one property.', function() {
				var fn = function() {
					new (crane.model("Person",{}))();
				}

				expect(fn).to.throw("modelDef does not meet minimum keys");
			});

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

		describe('Notifiers', function() {
			it('should notify when firstName is set', function(done){
				craneModel.notify('firstName', function() {
					done();
				});
				craneModel.firstName = "Bob";
			});
			it('should not notify when lastName is set', function(done) {
				var notified = false;
				var onSet = function() {
					if (!notified) { craneModel.off('set', onSet); done(); }
					else {
						throw new Error("Was notified that lastName was set");
					}
				};
				craneModel.on('set', onSet);
				craneModel.notify('firstName', function() {
					notified = true;
				});
				craneModel.lastName = "Barker";
			});
			it('should notify when a property of an object is set', function(done) {
				craneModel.notify('favouriteThing.looksLike', function() {
					done();
				});
				craneModel.favouriteThing.looksLike = "A Dog";
			});
			it('should notify even when an object property changes type', function(done) {
				craneModel.favouriteThing = "Puppies";
				craneModel.notify('favouriteThing', function() {
					done();
				})
				craneModel.favouriteThing = "Cats";
			});
			it('should notify even when a property changes to an object', function(done) {
				craneModel.firstName = {
					is : "Bob"
				};
				craneModel.notify('firstName.is', function() {
					done();
				})
				craneModel.firstName.is = "Charlie";
			});
			it('should notify when an element of an array is set', function(done) {
				craneModel.notify('favouriteFoods[0]', function() {
					done();
				});
				craneModel.favouriteFoods[0] = "Beans";
			});
			it('should notify when a property of an object in an array is set', function(done) {
				craneModel.notify('favouritePlaces[0].name', function() {
					done();
				});
				craneModel.favouritePlaces[0].name = "Barbados";
			});
			it('should notify when an element is added to an array', function(done) {
				craneModel.notify('favouriteFoods', function() {
					done();
				});
				craneModel.favouriteFoods.push("Bananas");
			});
			it('should notify when a property of an object in an array in an array is set', function(done) {
				craneModel.notify('favouriteStuff[0][0].is', function() {
					done();
				});
				craneModel.favouriteStuff[0][0].is = "Helicopter";
			});
			it('should notify when an element is removed from an array', function(done) {
				craneModel.notify('favouriteFoods', function() {
					done();
				});
				craneModel.favouriteFoods.pop();
			});
		});
	});
	mocha.run();
});
