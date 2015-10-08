var Path = require('path');

// util methods
window.getAssetsPath = function () {
    [].splice.call(arguments, 0, 0, __dirname, 'fixtures/assets');

    return Path.resolve( Path.join.apply(Path, arguments) );
};


// engine framework
Editor.require('app://engine-framework/src');

Editor.isRuntime = true;

// canvas assets
var Meta = Editor.require('app://asset-db/lib/meta');
Editor.metas = {
    asset: Meta.AssetMeta,
    folder: Meta.FolderMeta
};
Editor.assets = {};
Editor.inspectors = {};

Editor.require('app://builtin/fire-assets/init');

// cocos
Editor.require('app://runtime/runtime-cocos2d-js');

// init asset library
cc.AssetLibrary.init( Path.resolve(Path.join(__dirname, 'fixtures/library')) );

describe('test wrappers', function () {
    // test wrappers
    var pageTests = [
        'engine',
        'scene',
        'node',
        'sprite',
        'bitmap-font',
        'button',
        'particle',
        'label-ttf',
        'scale9-sprite',
        "asset"
    ];

    var canvas = document.getElementById('gameCanvas');

    var option = {
        width:  400,
        height: 400,
        canvas: canvas
    };

    it('init runtime', function(done) {
        Fire.engine.initRuntime(option, function () {
            pageTests.forEach( function (test) {
                require( Path.join(__dirname, 'page', test + '.js' ) );
            });

            done();
        });
    });
});
