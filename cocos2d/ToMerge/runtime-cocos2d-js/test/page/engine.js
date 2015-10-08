describe( 'test engine', function () {

    it( 'pause when init runtime', function () {
        expect(cc.director.isPaused()).to.equal(true);
    });

    it( 'play runtime', function () {
        Fire.engine.playRuntime();

        expect(cc.director.isPaused()).to.equal(false);
    });

    it( 'pause runtime', function () {
        Fire.engine.pauseRuntime();

        expect( cc.director.isPaused() ).to.equal(true);
    });

    it( 'resume runtime', function() {
        Fire.engine.resumeRuntime();

        expect( cc.director.isPaused() ).to.equal(false);
    });

    it( 'getCurrentSceneN', function () {
        assert(Fire.engine.getCurrentSceneN());
    });
});


describe( 'Fire.engine.getIntersectionList', function () {
    var scene;
    var nodes;
    var wrappers;

    var oldScene;

    before(function () {
        oldScene = cc.director.getRunningScene();
    });

    after(function () {
        cc.director.runScene(oldScene);
        cc.director.setNextScene();
    });

    beforeEach(function () {
        scene = new cc.Scene();
        cc.director.runScene(scene);
        cc.director.setNextScene();

        nodes = [];
        wrappers = [];

        for(var i = 0; i<2; i++) {
            var node = new cc.Node();
            var wrapper = cc(node);
            node.setAnchorPoint(0.5, 0.5);

            scene.addChild(node);
            wrapper.size = new cc.Vec2(100, 100);

            nodes.push(node);
            wrappers.push(wrapper);
        }

        wrappers[0].position = new cc.Vec2(100, 100);
        wrappers[1].position = new cc.Vec2(200, 200);
    });


    it( 'should get an empty array if not intersects any node', function () {
        var rect = new cc.FireRect(0,0, 49,49);
        var list = Fire.engine.getIntersectionList(rect);

        expect( list.length ).to.equal( 0 );
    });

    it( 'should get an array with a node if intersects a node', function () {
        var rect = new cc.FireRect(0,0, 50,50);
        var list = Fire.engine.getIntersectionList(rect);

        expect( list.length ).to.equal( 1 );
    });

    it( 'should not get the node if the node rotate and not intersects it', function () {
        wrappers[0].rotation = 45;

        var rect = new cc.FireRect(0,0, 64,64);
        var list = Fire.engine.getIntersectionList(rect);

        expect( list.length ).to.equal( 0 );
    });

    it( 'should get the node if the node rotate and intersects it', function () {
        wrappers[0].rotation = 45;

        var rect = new cc.FireRect(0,0, 65,65);
        var list = Fire.engine.getIntersectionList(rect);

        expect( list.length ).to.equal( 1 );
    });

    it( 'should get an array with two nodes if intersects two nodes', function () {

        var rect = new cc.FireRect(0,0, 200,200);
        var list = Fire.engine.getIntersectionList(rect);

        expect( list.length ).to.equal( 2 );
    });

});
