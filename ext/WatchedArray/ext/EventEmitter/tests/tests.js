require(["../src/EventEmitter.js"], function(EventEmitter) {
	describe('EventEmitter', function() {
		var emitter;

		describe("Creating emitters", function() {
			before(function() {
				emitter = new EventEmitter();
			});

			it('should be an EventEmitter ', function() {
				emitter.should.be.instanceof(EventEmitter);
			});

			it('should have an "events" object', function() {
				should.exist(emitter.events);
				emitter.events.should.be.a('object');
			});

			it('"events" should be empty', function() {
				Object.keys(emitter.events).length.should.equal(0);
			});
		});

		describe("Adding listeners", function() {
			before(function() {
				emitter = new EventEmitter();
			});

			it('should have no "events"', function() {
				Object.keys(emitter.events).length.should.equal(0);
				emitter.on('emitTest', function() {
				});
			});

			it('should have 1 "event" with 1 callback', function() {
				Object.keys(emitter.events).length.should.equal(1);
				should.exist(emitter.events["emitTest"]);
				emitter.events["emitTest"].length.should.equal(1);
				emitter.on('emitTest', function() {
				});
			});

			it('should have 1 "events" with 2 callbacks', function() {
				Object.keys(emitter.events).length.should.equal(1);
				should.exist(emitter.events["emitTest"]);
				emitter.events["emitTest"].length.should.equal(2);
				emitter.on('anotherEmitTest', function() {
				});
				emitter.on('anotherEmitTest', function() {
				});
			});

			it('should have 2 "events" with 2 callbacks', function() {
				Object.keys(emitter.events).length.should.equal(2);
				should.exist(emitter.events["emitTest"]);
				emitter.events["emitTest"].length.should.equal(2);
				should.exist(emitter.events["anotherEmitTest"]);
				emitter.events["anotherEmitTest"].length.should.equal(2);
			});
		});

		describe("Emitting events", function() {
			before(function() {
				emitter = new EventEmitter();
			});

			before(function() {
				emitter.on('emitTest', function(done) {
					done();
				});
			});

			it('should emit an event', function(done) {
				emitter.emit('emitTest', done).should.equal(true);
			});

			it('should return false when emitting an event with no listeners', function() {
				emitter.emit('noListeners').should.equal(false);
			});
		});

		describe("Removing listeners", function() {
			before(function() {
				emitter = new EventEmitter();
			});

			var callback1 = function() {};
			var callback2 = function() {};
			before(function() {
				emitter.on('emitTest', callback1);
				emitter.on('emitTest', callback2);
			});

			it('should remove 1 listener', function() {
				emitter.off('emitTest', callback1);
				Object.keys(emitter.events).length.should.equal(1);
			});

			it('should not let you remove a listener without a callback reference', function() {
				var fn = function() {
					emitter.off('emitTest');
				}
				expect(fn).to.throw("You must specify both");
			});

			it('should let you remove all listeners via allOff', function() {
				emitter.allOff('emitTest');
				Object.keys(emitter.events).length.should.equal(0);
			});
		});
	});
	mocha.run();
});
