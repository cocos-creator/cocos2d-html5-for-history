test('CallbacksInvoker', function () {
    var ci = new cc._Test.CallbacksInvoker();

    var cb1 = new Callback();
    var cb2 = new Callback();
    var cb3 = new Callback();
    strictEqual(ci.add('a', cb1), true, 'first cb key');
    strictEqual(ci.has('a', function () {}), false, '`has` should return false if the callback not exists');
    strictEqual(ci.has('a', cb1), true, '`has` should return true if the callback exists');
    strictEqual(ci.add('a', cb2), false, 'not first key');
    strictEqual(ci.add('b', cb3), true, 'another first key');
    strictEqual(ci.add('nil', undefined), true, 'null callback should also return true');

    cb1.enable();
    cb2.enable();
    ci.invoke('a');
    cb1.once('1 should be called');
    cb2.once('2 should be called');

    var invokeA = ci.bindKey('a');
    invokeA();
    cb1.once('1 should be called again').disable();
    cb2.once('2 should be called again').disable();

    cb3.enable();
    ci.invoke('b');
    cb3.once('3 should be called');

    ci.remove('a', cb2);
    cb2.setDisabledMessage('callback should not be invoked after removed');
    cb1.enable();
    ci.invoke('a');
    cb1.once('callback should still be invoked if not excatly the one being removed');

    ci.add('a', cb2);
    strictEqual(ci.has('a'), true, '`has` should return true if has any callback');
    ci.removeAll('a');
    strictEqual(ci.has('a'), false, '`has` should return false if all callbacks removed');
    cb1.setDisabledMessage('should not be called after all removed');
    cb2.setDisabledMessage('should not be called after all removed');
    ci.invoke('a');
});

test('CallbacksInvoker support target', function () {
    var ci = new cc._Test.CallbacksInvoker();
    var cb1 = function () {
        cb1.count++;
        if (this.name)
            this.count++;
    };
    cb1.count = 0;
    var cb2 = new Callback();
    var cb3 = new Callback();

    var target1 = {
        name: 'CallbackTarget1',
        count: 0
    };
    var target2 = {
        name: 'CallbackTarget2',
        count: 0
    };

    ci.add('a', cb1);
    strictEqual(ci.add('a', cb1, target1), false, 'can add callback with target');
    ci.add('a', cb1);
    ci.add('a', cb1, target2);
    ci.add('a', cb1, target2);
    ci.add('a', cb2, target2);
    ci.add('a', cb2, target1);
    ci.add('a', cb3);
    ci.add('a', cb3, target1);

    strictEqual(ci.add('b', cb1, target1), true, 'can add callback with target for new event key');
    strictEqual(ci.has('a', cb2), false, '`has` should return false if the callback without target not exists');
    strictEqual(ci.has('a', cb2, target1), true, '`has` should return true if the callback with correct target exists');
    strictEqual(ci.has('a', cb3), true, '`has` should return true if the callback without target exists');

    cb2.enable();
    cb3.enable();
    ci.invoke('a');
    strictEqual(cb1.count, 5, 'callback1 should be invoked five times');
    strictEqual(target1.count, 1, 'callback1 should be invoked one time with target1');
    strictEqual(target2.count, 2, 'callback2 should be invoked two times with target2');

    cb2.expect(2, 'callback2 should be called twice');
    cb3.expect(2, 'callback3 should be called twice');

    strictEqual(ci.has('a', target1), false, '`has` should return false if the target is given');

    ci.remove('b', cb1);
    ci.remove('b', cb1, target2);
    strictEqual(ci.has('b', cb1, target1), true, 'remove callback without the correct target should fail');
    ci.remove('b', cb1, target1);
    strictEqual(ci.has('b', cb1, target1), false, 'remove callback with the correct callback and target should succeed');

    cb1.count = 0;
    target1.count = 0;
    target2.count = 0;
    cb2.calledCount = 0;
    cb3.calledCount = 0;
    ci.remove('a', cb1, target2);
    ci.remove('a', cb1, target1);
    ci.remove('a', cb2, target2);
    ci.remove('a', cb3, target2);
    ci.invoke('a');
    strictEqual(target1.count, 0, 'callback1 with target1 should not be invoked after remove');
    strictEqual(target2.count, 1, 'callback1 with target2 should be invoked only once after remove one');

    strictEqual(cb1.count, 3, 'callback1 should be invoked three times after removed two');
    cb2.expect(1, 'callback2 should be called once');
    cb3.expect(2, 'callback3 should be called twice');
});

test('CallbacksInvoker remove target', function () {
    var ci = new cc._Test.CallbacksInvoker();
    var cb1 = new Callback();
    var cb2 = new Callback();
    var cb3 = new Callback();

    var target1 = {
        name: 'CallbackTarget1',
        count: 0
    };
    var target2 = {
        name: 'CallbackTarget2',
        count: 0
    };

    ci.add('a', cb1);
    ci.add('a', cb1, target1);
    ci.add('a', cb1);
    ci.add('a', cb1, target2);
    ci.add('a', cb1, target2);
    ci.add('a', cb2, target2);
    ci.add('a', cb2, target1);
    ci.add('a', cb3);
    ci.add('a', cb3, target1);

    cb1.enable();
    cb2.enable();
    cb3.enable();

    ci.invoke('a');
    cb1.expect(5, 'callback1 should be called five times');
    cb2.expect(2, 'callback2 should be called twice');
    cb3.expect(2, 'callback3 should be called twice');

    ci.removeAll(target1);

    cb1.calledCount = 0;
    cb2.calledCount = 0;
    cb3.calledCount = 0;

    ci.invoke('a');
    cb1.expect(4, 'removed one, callback1 should be called four times');
    cb2.expect(1, 'removed one, callback2 should be called once');
    cb3.expect(1, 'removed one, callback3 should be called once');

    ci.removeAll(target2);

    cb1.calledCount = 0;
    cb2.calledCount = 0;
    cb3.calledCount = 0;

    ci.invoke('a');
    cb1.expect(2, 'removed two, callback1 should be called twice');
    cb2.expect(0, 'removed one, callback2 should not be called');
    cb3.expect(1, 'callback3 should be called once');
});
