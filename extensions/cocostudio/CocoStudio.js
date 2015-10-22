/****************************************************************************
 Copyright (c) 2011-2012 cocos2d-x.org
 Copyright (c) 2013-2014 Chukong Technologies Inc.

 http://www.cocos2d-x.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/
/**
 * The main namespace of Cocostudio, all classes, functions, properties and constants of Spine are defined in this namespace
 * @namespace
 * @name ccs
 */
var ccs = ccs || {};

/**
 * The same as cc._Class
 * @class
 */
ccs.Class = ccs.Class || cc._Class;
ccs.Class.extend = ccs.Class.extend || cc._Class.extend;

/**
 * The same as cc.Node
 * @class
 * @extends ccs.Class
 */
ccs.Node = ccs.Node || cc.Node;
ccs.Node.extend = ccs.Node.extend || cc.Node.extend;

/**
 * The same as cc.Sprite
 * @class
 * @extends ccs.Class
 */
ccs.Sprite = ccs.Sprite || cc.Sprite;
ccs.Sprite.extend = ccs.Sprite.extend || cc.Sprite.extend;

/**
 * The same as cc._Component
 * @class
 * @extends ccs.Class
 */
ccs.Component = ccs.Component || cc._Component;
ccs.Component.extend = ccs.Component.extend || cc._Component.extend;

/**
 * CocoStudio version
 * @constant
 * @type {string}
 */
ccs.cocostudioVersion = "v1.3.0.0";