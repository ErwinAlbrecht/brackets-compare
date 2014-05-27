/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */

/** Simple extension that adds a "File > Hello World" menu item. Inserts "Hello, world!" at cursor pos. */
define(function (require, exports, module) {  
    "use strict";
    var CodeMirror = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror");
    
    var templateString = "<div id='{{ id }}-editor'class='compare-editor'>\
                            <textarea id='{{ id }}-area' class='compare-content'>{{ text }}</textarea>\
                            <!--<div id='' class='compare-status'> {{ title }} </div>--> \
                         </div>";
    var CODEMIRRORLINEOFFSET = -1;
    
    function makeMarker(color, content) {
      var marker = document.createElement("div");
      marker.style.color = color;
      marker.innerHTML = content;
      return marker;
    }
    
    function View(options) {
        this.id = options.id;
        this.title = options.title || "";
        this.text = options.text || "";
        this.lineNumbers = options.lineNumbers || true;
        this.lineWrapping = options.lineWrapping || true;
        this.mode = options.mode || View.MODES["js"];
        this.cm = null; // Codemirror instance
        
        this.initialize = this.initialize.bind(this);
        this.load   = this.load.bind(this);
        this.refresh = this.refresh.bind(this);
        this.setText = this.setText.bind(this);
        this.getText = this.getText.bind(this);
        this.render = this.render.bind(this);
        this.markGutter = this.markGutter.bind(this);
        
        this.initialize();
    };
    
    View.MODES = {
        html : "text/html",
        css  : "css",
        js   : "javascript" 
    };
    
    View.markers = {
        added: {
            className: "added",
            color: "#00784A",
            value: "+"
        },
        addedChars: "added-chars",
        removed: {
            className: "removed",
            color: "#8E0028",
            value: "-"
        },
        removedChars: "removed-chars"
    };
    
    View.prototype.initialize = function() {
        this.setText(this.text);
    };
    
    View.prototype.load = function() {
       this.cm = CodeMirror.fromTextArea(document.querySelector("#" + this.id + "-area"), {
            mode: this.mode,
            lineNumbers: this.lineNumbers,
            lineWrapping: this.lineWrapping,
            gutters: ["CodeMirror-linenumbers", "compares"]
        });
    };
    
    View.prototype.markLine = function(line, className) {
        this.cm.addLineClass(line, "background", className);
    };
    
    View.prototype.markGutter = function(line, color, value) {
        var info = this.cm.lineInfo(line);
        this.cm.setGutterMarker(line, "compares", info.gutterMarkers ? null : makeMarker(color, value));  
    };
    
    View.prototype.markLines = function(from, to, marker) {
        var i = from;
        while(i <= to) {
            this.markGutter(i + CODEMIRRORLINEOFFSET, marker.color, marker.value);
            this.markLine(i + CODEMIRRORLINEOFFSET, marker.className); 
            i++
        }
    };
    
    View.prototype.markChars = function(from, to , className) {
        this.cm.markText({
            line: from.line + CODEMIRRORLINEOFFSET,
            ch: from.ch
        }, {
            line: to.line + CODEMIRRORLINEOFFSET,
            ch: from.ch
        }, {
            className: className
        });
    };
    
    View.prototype.refresh = function() {
        if (this.cm) {
            this.cm.refresh();
        }
    };
    
    View.prototype.setText = function(text) {
        if (this.cm) {
            this.cm.setValue(this.text = text);
        }
    };
    
    View.prototype.getText = function() {
        return this.cm ? this.cm.getValue() : "";      
    };
    
    View.prototype.destroy = function() {
        this.id = null;
        this.cm = null;
        this.text = "";
        this.lineNumbers = true;
        this.lineWrapping = true;
        this.mode = View.MODES["js"];
        
    };
    
    View.prototype.render = function() {
        return Mustache.render(templateString, { id: this.id, title: this.title, text: this.text });
    };
    
    exports.CompareView = View;
});