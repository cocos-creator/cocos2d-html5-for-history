/****************************************************************************
 Copyright (c) 2008-2010 Ricardo Quesada
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

 Use any of these editors to generate BMFonts:
 http://glyphdesigner.71squared.com/ (Commercial, Mac OS X)
 http://www.n4te.com/hiero/hiero.jnlp (Free, Java)
 http://slick.cokeandcode.com/demos/hiero.jnlp (Free, Java)
 http://www.angelcode.com/products/bmfont/ (Free, Windows only)
 ****************************************************************************/

(function(){
    cc.Label.TTFWebGLRenderCmd = function(renderableObject){
        cc.Node.WebGLRenderCmd.call(this, renderableObject);
        this._needDraw = true;
        this._labelTexture = null;
        this._labelCanvas = document.createElement("canvas");
        this._labelCanvas.width = 1;
        this._labelCanvas.height = 1;
        this._labelContext = this._labelCanvas.getContext("2d");
        this._quad = new cc.V3F_C4B_T2F_Quad();
        this._quadDirty = true;
        this._quadWebBuffer = cc._renderContext.createBuffer();
        this._shaderProgram = cc.shaderCache.programForKey(cc.SHADER_POSITION_TEXTURECOLOR);
        this._splitedStrings = null;
    };

    var proto = cc.Label.TTFWebGLRenderCmd.prototype = Object.create(cc.Node.WebGLRenderCmd.prototype);
    proto.constructor = cc.Label.TTFWebGLRenderCmd;

    proto._rebuildLabelSkin = function() {
        if(this._node._labelSkinDirty) {
            this._splitString();
            this._bakeLabel();
            this._prepareQuad();
            this._node._labelSkinDirty = false;
        }
    };
    proto.rendering = function (ctx) {

        this._rebuildLabelSkin();

        var gl = ctx || cc._renderContext ;
        this._shaderProgram.use();
        this._shaderProgram._setUniformForMVPMatrixWithMat4(this._stackMatrix);
        cc.glBlendFunc(cc.BlendFunc._alphaNonPremultiplied().src,cc.BlendFunc._alphaNonPremultiplied().dst);
        cc.glBindTexture2DN(0,this._labelTexture);
        cc.glEnableVertexAttribs(cc.VERTEX_ATTRIB_FLAG_POS_COLOR_TEX);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._quadWebBuffer);
        if (this._quadDirty) {
            gl.bufferData(gl.ARRAY_BUFFER, this._quad.arrayBuffer, gl.DYNAMIC_DRAW);
            this._quadDirty = false;
        }
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);                   //cc.VERTEX_ATTRIB_POSITION
        gl.vertexAttribPointer(1, 4, gl.UNSIGNED_BYTE, true, 24, 12);           //cc.VERTEX_ATTRIB_COLOR
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 24, 16);                  //cc.VERTEX_ATTRIB_TEX_COORDS
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    proto._splitString = function() {
        var node = this._node;
        //splite string by \n;
        this._splitedStrings = node._string.split("\n");

    };
    proto._bakeLabel = function() {
        var node = this._node;
        var textMetric = this._labelContext.measureText(node._string);
        var canvasSizeX = node._contentSize.width;
        var canvasSizeY = node._contentSize.height;
        this._labelCanvas.width = canvasSizeX;
        this._labelCanvas.height = canvasSizeY;
        this._labelContext.clearRect(0,0,this._labelCanvas.width,this._labelCanvas.height);
        this._labelContext.fillStyle = "rgb(255,0,0)";
        this._labelContext.fillRect(0,0,this._labelCanvas.width,this._labelCanvas.height);
        this._labelContext.fillStyle = "rgb(255,255,255)";

        var labelX; var labelY;
        var hAlign; var vAlign;
        //apply align
        {
            if(cc.Label.HorizontalAlign.RIGHT === node._hAlign) {
                hAlign = "right";
                labelX = canvasSizeX;
            }
            else if(cc.Label.HorizontalAlign.CENTER === node._hAlign) {
                hAlign = "center";
                labelX = canvasSizeX/2;
            }
            else {
                hAlign = "left";
                labelX = 0;
            }

            this._labelContext.textAlign = hAlign;
            if(cc.Label.VerticalAlign.TOP === node._vAlign) {
                vAlign = "top";
                labelY = 0;
            }
            else if(cc.Label.VerticalAlign.CENTER === node._vAlign) {
                vAlign = "middle";
                labelY = canvasSizeY/2;
            }
            else {
                vAlign = "bottom";
                labelY = canvasSizeY;
            }
            this._labelContext.textBaseline = vAlign;
        }

        this._labelContext.fillText(node._string,labelX,labelY, canvasSizeX);
        this._labelTexture = new cc.Texture2D();
        this._labelTexture.initWithElement(this._labelCanvas);
        this._labelTexture.handleLoadedTexture();
    };

    proto._prepareQuad = function() {
        var quad = this._quad;
        var white = cc.color(255,255,255,255);
        var width = this._node._contentSize.width;
        var height = this._node._contentSize.height;
        quad._bl.colors = white;
        quad._br.colors = white;
        quad._tl.colors = white;
        quad._tr.colors = white;

        quad._bl.vertices = new cc.Vertex3F(0,0,0);
        quad._br.vertices = new cc.Vertex3F(width,0,0);
        quad._tl.vertices = new cc.Vertex3F(0,height,0);
        quad._tr.vertices = new cc.Vertex3F(width,height,0);

        //texture coordinate should be y-flipped
        quad._bl.texCoords = new cc.Tex2F(0,1);
        quad._br.texCoords = new cc.Tex2F(1,1);
        quad._tl.texCoords = new cc.Tex2F(0,0);
        quad._tr.texCoords = new cc.Tex2F(1,0);

        this._quadDirty = true;
    }

})();