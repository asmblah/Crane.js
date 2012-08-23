require(["../src/forEach.js"], function(forEach) {
	describe('ForEach', function() {
		var count = 0;
		var counter = function() {
			count++;
		}
		beforeEach(function() {
			count = 0;
		});

		describe("Counts", function() {
			it('should run 0 times', function() {
				forEach([], counter);
				count.should.equal(0);
			});

			it('should run 1 times', function() {
				forEach([0], counter);
				count.should.equal(1);
			});

			it('should run 2 times', function() {
				forEach([0, 1], counter);
				count.should.equal(2);
			});

			it('should run 10000 times', function() {
				var array = [];
				for (var i = 0; i <= 10000; i++) {
					array.push(i);
				}
				forEach(array, counter);
				count.should.equal(array.length);
			});
		});

		describe("Values", function() {
			it('should have the correct values', function() {
				var array = [];
				for (var i = 0; i <= 10000; i++) {
					array.push(i);
				}
				var c = 0;
				forEach(array, function(v, k) {
					v.should.equal(array[c]);
					c++;
				});
			});
		});

		describe("Keys", function() {
			it('should have the correct keys', function() {
				var array = [];
				for (var i = 0; i <= 10000; i++) {
					array.push(i);
				}
				var c = 0;
				forEach(array, function(v, k) {
					k.should.equal(c);
					c++;
				});
			});
		});
	});
	mocha.run();
});
