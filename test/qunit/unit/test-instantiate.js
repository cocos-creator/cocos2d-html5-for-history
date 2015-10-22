﻿largeModule('Instantiate');

(function () {
    var match = function (obj, expect, info) {
        deepEqual(cc.instantiate(obj), expect, info);
    };

    test('basic', function () {
        match({}, {}, 'smoke test1');

        match({ 1: 1, 2: [2, {3: '3'}]}, {1: 1, 2: [2, {3: '3'}]}, 'simple test1');

        var obj = {};
        var clone = cc.instantiate({
            ref1: obj,
            ref2: obj,
        });
        strictEqual(clone.ref1, clone.ref2, 'should track the same reference');

        // test class

        var BaseAsset = function () {
            this.inheritProp = 321;
        };
        var MyAsset = (function () {
            var _super = BaseAsset;

            function MyAsset () {
                _super.call(this);

                this.emptyArray = [];
                this.array = [1, '2', {a:3}, [4, [5]], true];
                this.string = 'unknown';
                this.number = 1;
                this.boolean = true;
                this.emptyObj = {};
                this.obj = {};
            }
            cc.js.extend(MyAsset, _super);
            cc.js.setClassName('MyAsset', MyAsset);

            // should not instantiate --------------------------
            MyAsset.staticFunc = function () { };
            MyAsset.staticProp = cc.Enum({
                UseBest: -1,
                Ascending: -1,
                Descending: -1
            });
            MyAsset.prototype.protoFunc = function () { };
            MyAsset.prototype.protoProp = 123;
            // -------------------------------------------------

            return MyAsset;
        })();
        var asset = new MyAsset();
        asset.dynamicProp = false;
        var expect = new MyAsset();
        expect.dynamicProp = false;

        var clone = cc.instantiate(asset);

        strictEqual(asset.constructor, clone.constructor, 'instantiated should has the same type');
        deepEqual(clone, expect, 'can instantiate class');

        cc.js.unregisterClass(MyAsset);
    });

    test('objFlags and hash id', function () {
        var obj = new cc.Object();
        obj._objFlags = cc.Object.Flags.EditorOnly;

        var clone = cc.instantiate(obj);

        strictEqual(clone._objFlags, cc.Object.Flags.EditorOnly, 'can clone obj flags');

        //var hashObj = new cc.HashObject();
        //var id = hashObj.id;    // generate id
        //var clonedHashObj = cc.instantiate(hashObj);
        //
        //notEqual(clonedHashObj.id, id, 'should not clone id');
        //notEqual(clonedHashObj.hashCode, hashObj.hashCode, 'should not clone hashCode');
    });

    test('CCClass', function () {
        var Sprite = cc.Class({
            name: 'Sprite',
            ctor: function () {
                this.image = 'sprite.png';
            },
            properties: {
                size: new cc.Vec2(128, 128),
                _isValid: {
                    default: true,
                    visible: true,
                    serializable: false
                },
            }
        });

        var sprite = new Sprite();
        sprite.image = 'blabla';
        sprite.size = new cc.Vec2(32, 2);
        sprite._isValid = false;

        var clone = cc.instantiate(sprite);

        strictEqual(sprite.constructor, clone.constructor, 'instantiated should has the same type');
        deepEqual(clone.size, new cc.Vec2(32, 2), 'can clone variable defined by property');
        strictEqual(clone.image, 'sprite.png', 'should not clone variable which not defined by property');
        strictEqual(clone._isValid, true, 'should not clone non-serialized field');

        cc.js.unregisterClass(Sprite);
    });

    test('Circular Reference', function () {
        function MyAsset () {
            // array1 = [1, array2]
            // array2 = [array1, 2]
            this.array1 = [1];
            this.array2 = [this.array1, 2];
            this.array1.push(this.array2);

            this.dict1 = {num: 1};
            this.dict2 = {num: 2, other: this.dict1};
            this.dict1.other = this.dict2;
        }
        var clone = cc.instantiate(new MyAsset());

        deepEqual(new MyAsset(), clone, 'can instantiate');
        strictEqual(clone.array1[1], clone.array2, 'two arrays can circular reference each other 1');
        strictEqual(clone.array2[0], clone.array1, 'two arrays can circular reference each other 2');
        strictEqual(clone.dict1.other, clone.dict2, 'two dicts can circular reference each other 1');
        strictEqual(clone.dict2.other, clone.dict1, 'two dicts can circular reference each other 2');
    });

    test('asset reference', function () {
        var sprite = {};
        sprite.sprite = new cc.SpriteAsset();

        var clone = cc.instantiate(sprite);

        ok(sprite.sprite === clone.sprite, 'should not clone asset');
    });

    test('mixin', function () {
        function Node () {
            TestNode.call(this);
        }
        cc.js.extend(Node, TestNode);
        Node.prototype.init = function () {};
        cc.Runtime.registerNodeType(Node, cc.Class({
            extends: TestWrapper,
            createNode: function () {
                return new Node();
            }
        }));

        var Script = cc.Class({
            name: '2154648724566',
            extends: cc.Behavior,
            init: function () {},
        });

        var node = new Node();
        cc.mixin(node, Script);

        var clone = cc.instantiate(node);

        strictEqual(cc.hasMixin(clone, Script), true, 'should has mixin');
        strictEqual(clone.init, Script.prototype.init, 'should override origin method');

        cc.js.unregisterClass(Script);
    });

    test('redirect node reference', function () {
        function Node () {
            TestNode.apply(this, arguments);
        }
        cc.js.extend(Node, TestNode);
        cc.Runtime.registerNodeType(Node, cc.Class({
            extends: TestWrapper,
            properties: {
                nodeInWrapper: {
                    default: null,
                    type: Node
                },
                nodeArrayInWrapper: {
                    default: [],
                    type: Node
                },
                wrapper: null,
                otherNodeInWrapper: {
                    default: null,
                    type: Node
                },
                otherWrapper: null,
            }
        }));
        var Script = cc.Class({
            name: '2154648724566',
            extends: cc.Behavior,
            properties: {
                nodeInBeh: {
                    default: null,
                    type: Node
                },
                nodeArrayInBeh: {
                    default: [],
                    type: Node
                },
                otherNodeInBeh: {
                    default: null,
                    type: Node
                },
            }
        });

        var parent = new Node('parent');
        var child = new Node('child');
        var other = new Node('other');
        parent.children = [child];
        child.parent = parent;
        cc.mixin(parent, Script);
        cc.mixin(child, Script);

        parent.nodeInBeh = child;
        parent.nodeArrayInBeh = [child, other];
        parent.otherNodeInBeh = other;
        child.nodeInBeh = parent;
        child.nodeArrayInBeh = [parent, other];
        child.otherNodeInBeh = other;

        cc.getWrapper(parent).nodeInWrapper = child;
        cc.getWrapper(parent).nodeArrayInWrapper = [child, other];
        cc.getWrapper(child).nodeInWrapper = parent;
        cc.getWrapper(child).nodeArrayInWrapper = [parent, other];
        cc.getWrapper(parent).wrapper = cc.getWrapper(child);
        cc.getWrapper(child).wrapper = cc.getWrapper(parent);
        cc.getWrapper(parent).otherWrapper = cc.getWrapper(other);
        cc.getWrapper(child).otherWrapper = cc.getWrapper(other);
        cc.getWrapper(parent).otherNodeInWrapper = other;
        cc.getWrapper(child).otherNodeInWrapper = other;

        var cloneParent = cc.instantiate(parent);
        var cloneChild = cloneParent.children[0];

        notEqual(child, cloneChild, 'should clone child');
        strictEqual(cloneChild.parent, cloneParent, 'should redirect parent reference');

        ok(cloneParent.nodeInBeh === cloneChild, 'should redirect child reference in behavior');
        fastArrayEqual(cloneParent.nodeArrayInBeh, [cloneChild, other], 'should redirect array of child reference in behavior');
        ok(cloneChild.nodeInBeh === cloneParent, 'should redirect parent reference in behavior');
        fastArrayEqual(cloneChild.nodeArrayInBeh, [cloneParent, other], 'should redirect array of parent reference in behavior');
        ok(cloneParent.otherNodeInBeh === other, 'should not clone other node in parent behavior');
        ok(cloneChild.otherNodeInBeh === other, 'should not clone other node in child behavior');

        ok(cc.getWrapper(cloneParent).nodeInWrapper === cloneChild, 'should redirect child reference in wrapper');
        fastArrayEqual(cc.getWrapper(cloneParent).nodeArrayInWrapper, [cloneChild, other], 'should redirect array of child reference in wrapper');
        ok(cc.getWrapper(cloneChild).nodeInWrapper === cloneParent, 'should redirect parent reference in wrapper');
        fastArrayEqual(cc.getWrapper(cloneChild).nodeArrayInWrapper, [cloneParent, other], 'should redirect array of parent reference in wrapper');
        ok(cc.getWrapper(cloneChild).otherNodeInWrapper === other, 'should not clone other node in child wrapper');
        ok(cc.getWrapper(cloneParent).otherNodeInWrapper === other, 'should not clone other node in parent wrapper');
        ok(cc.getWrapper(cloneChild).wrapper === cc.getWrapper(cloneParent), 'should redirect wrapper to new parent');
        ok(cc.getWrapper(cloneParent).wrapper === cc.getWrapper(cloneChild), 'should redirect wrapper to new child');
        ok(cc.getWrapper(cloneChild).otherWrapper === cc.getWrapper(other), 'should not clone other otherWrapper in child wrapper');
        ok(cc.getWrapper(cloneParent).otherWrapper === cc.getWrapper(other), 'should not clone other otherWrapper in parent wrapper');

        cc.js.unregisterClass(Script);
    });
})();
