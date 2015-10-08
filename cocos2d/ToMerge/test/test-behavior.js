require('../src');
require('./lib/init');
//var BehTester = require('./lib/behavior-callback-tester');

var DebugPage = 0;
var PageLevel = true;
var CoreLevel = false;

describe('Behavior', function () {
    var spawnRunner = require('./lib/spawn-runner');
    if (!spawnRunner(this, __filename, DebugPage, PageLevel, CoreLevel)) {
        return;
    }

    describe('onLoad', function () {

        describe('in edit mode', function () {
            before(function () {
                Fire.engine._reset();
            });
            it('should not be called in edit mode', function () {
                var node = new TestNode();
                var called = false;
                Fire.mixin(node, cc.FireClass({
                    extends: Fire.Behavior,
                    onLoad: function () {
                        called = true;
                    }
                }));
                expect(called).to.be.false;
            });
        });

        describe('in play mode', function () {
            var Script = cc.FireClass({
                extends: cc.FireClass({
                    extends: cc.FireClass({
                        extends: Fire.Behavior,
                        onLoad: function () {
                            this.onLoadCalled = true;
                        }
                    })
                })
            });
            var Script2 = cc.FireClass({
                extends: Fire.Behavior,
                onLoad: function () {
                    this.onLoadCalledBy2 = true;
                }
            });
            var node1 = new TestNode();
            var node2 = new TestNode();
            var bigNode = new TestNode();

            before(function () {
                Fire.engine._reset();
                Fire.engine.play();

                Fire.mixin(node1, Script);
                Fire.mixin(node2, Script);
                Fire.mixin(bigNode, Script, Script2);

                node1.children = [node2, bigNode];
            });

            it('should be called when play', function () {
                cc(node1)._onActivated();

                expect(node1.onLoadCalled).to.be.true;
                expect(node2.onLoadCalled).to.be.true;
                expect(bigNode.onLoadCalled).to.be.true;
                expect(bigNode.onLoadCalledBy2).to.be.true;
            });

            it('could be called only once', function () {
                node1.onLoadCalled = false;
                cc(node1)._onActivated();

                expect(node1.onLoadCalled).to.be.false;
            });

            it('should be called if script attached dynamically', function () {
                var node = new TestNode();
                Fire.mixin(node, Script);

                expect(node.onLoadCalled).to.be.true;

                node.onLoadCalled = false;

                Fire.mixin(node, Script2);

                expect(node.onLoadCalled).to.be.false;   // only called once
                expect(node.onLoadCalledBy2).to.be.true;
            });
        });
    });

    describe('update', function () {
        before(function () {
            Fire.engine._reset();
        });

        it('should be forbidden in edit mode', function () {
            var node = new TestNode();
            var called = false;
            Fire.mixin(node, cc.FireClass({
                extends: Fire.Behavior,
                update: function () {
                    called = true;
                }
            }));
            if (node.update) {
                node.update();
            }
            expect(called).to.be.false;
        });
    });
});