/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */

/** Simple extension that adds a "File > Hello World" menu item. Inserts "Hello, world!" at cursor pos. */
define(function (require, exports, module) {  
    "use strict";
    var PanelManager    =   brackets.getModule("view/PanelManager"),
        ExtensionUtils  =   brackets.getModule("utils/ExtensionUtils"),
        EditorManager   =   brackets.getModule("editor/EditorManager"),
        ResizerPanel    =   brackets.getModule("utils/Resizer"),
        Sidebar         =   brackets.getModule("project/SidebarView"),
        statusBar       =   brackets.getModule("widgets/StatusBar");
    
    var COMPARE_PANEL   =   "compare.panel";
    var statusInfoPanel = document.querySelector("#status-info");
    var cacheStatusInfo = statusInfoPanel.innerText;
        
    // Calculates size of the element to fill it containing container
    function _calcElHeight(el) {
        var $avlHeight = $(".content").height();
        
        el.siblings().each(function(index, el) {
            var $el = $(el);
           if($el.css("display") !== "none" && $el.css("position") !== "absolute") {
                $avlHeight -= $el.outerHeight();
           }       
        });
        return Math.max($avlHeight, 0);
    }
    
    function _addToolbarButton(id, tooltip, icon, handler) {
        var html = "<a href='#' id='" + id + "' title='" + 
            tooltip +"'> <span class='glyphicon glyphicon-" + icon + "'></span></a>";
        $("#main-toolbar .buttons").append(html);
        $("#" + id).on("click", handler);
    }
    
    function _removeToolbarButton(id, handler) {
        $("#" + id).off("click", handler);
        $("#" + id).remove();
    }

    function _setHeight($el) {
        $el.height(_calcElHeight($el));
    }
    
    function _showCurrentEditor() {
        $("#editor-holder").show();
    }
    
    function _hideCurrentEditor() {
       $("#editor-holder").hide(); 
    }    
    
    function Panel(options) {
        // The current focused view
        this.currentView = null;
        
        this.views = [];
        this.pane = null;
        this.$el = null;
        this.parent = null;
        this.layout = options.layout || Panel.layouts["horizontal"];
        
        //event handlers
        this.onLoaded = options.onLoaded || null;
        this.onDestroyed = options.onDestroyed || null;
        
        this.addView = this.addView.bind(this);
        this.loadViews = this.loadViews.bind(this);
        this.renderViews = this.renderViews.bind(this);
        this.refreshViews = this.refreshViews.bind(this);
        this.load = this.load.bind(this);
        this.show = this.show.bind(this);
        this.hide = this.hide.bind(this);
        this.remove = this.remove.bind(this);
        this.destroy = this.destroy.bind(this);
        this.onResize = this.onResize.bind(this);
        this.bindEvents = this.bindEvents.bind(this);
        
        this.toolbarCloseClick = this.toolbarCloseClick.bind(this);
        this.toolbarSaveClick = this.toolbarSaveClick.bind(this);
        
        this.initialize();
    };
    
    Panel.layouts = {
        vertical: "vertical",
        horizontal: "horizontal"
    }; 
    
    Panel.prototype.initialize = function() {
       
    };
    
    Panel.prototype.onResize = function()  {
        _setHeight(this.$el);
    };
    
    Panel.prototype.showInfo = function(content) {
        statusInfoPanel.innerHTML = content;
    };
    
    Panel.prototype.showSidebar = function() {
        Sidebar.show();
    };
    
    Panel.prototype.hideSidebar = function() {
        Sidebar.hide();
    };
    
    Panel.prototype.showBusy = function() {
        statusBar.showBusyIndicator(true);
    };
    
    Panel.prototype.hideBusy = function() {
        statusBar.hideBusyIndicator();
    };
    
    Panel.prototype.toolbarCloseClick = function() {
        this.destroy();
    };
    
    Panel.prototype.toolbarSaveClick = function() {
        var force = true;
        if (this.currentView) {
            this.currentView.saveFile();
        } else {
            // save all the view files
            for (var i = 0, len = this.views.length; i < len; i++) {
                this.views[i].saveFile(); 
            }
        }
    };
    
    Panel.prototype.loadToolbarButtons = function() {
        _addToolbarButton("compare-save", "Save file(s)", "floppy-save", this.toolbarSaveClick);
        _addToolbarButton("compare-hide", "Close views", "remove", this.toolbarCloseClick);
    };
    
    Panel.prototype.unloadToolbarButtons = function(){
        _removeToolbarButton("compare-save", this.toolbarSaveClick);
        _removeToolbarButton("compare-hide", this.toolbarCloseClick);
    };
    
    Panel.prototype.setLayout = function(layout) {
        this.layout = layout;
    };
    
    Panel.prototype.bindEvents = function() {
        window.addEventListener("resize", this.onResize);
    };
    
    Panel.prototype.loadViews = function() {
        for (var i = 0, len = this.views.length; i < len; i++) {
            this.views[i].load(); 
        }
    };
    
    Panel.prototype.refreshViews = function() {
        for (var i = 0, len = this.views.length; i < len; i++) {
            this.views[i].refresh(); 
        }
    };    
    
    Panel.prototype.load = function() {
        this.renderViews();
        this.loadViews();
        this.loadToolbarButtons();
        if (this.onLoaded) {
            this.onLoaded(this);
        }
    };
    
    Panel.prototype.addView = function(editorView) {
        this.views.push(editorView);
    };
    
    Panel.prototype.renderViews = function() {
        var content = "<div id='compare-panel' class='compare-panel' >";
        for (var i = 0, len = this.views.length; i < len; i++) {
            content += this.views[i].render(this.layout); 
        }
        content += "</div>"    
        this.pane = PanelManager.createBottomPanel(COMPARE_PANEL, $(content), 1000);
        this.$el = $("#compare-panel");
        this.parent = this.$el.parent();
        this.bindEvents();
    };
    
    Panel.prototype.remove = function() {
        if( this.$el) {
            this.$el.remove();
        }
    };
    
    Panel.prototype.show = function() {
        if (this.pane) {
            this.hideSidebar();
            _hideCurrentEditor(); 
            _setHeight(this.$el);
            this.pane.show();
            this.refreshViews();
        }
    };
    
    Panel.prototype.destroy = function() {
        this.hide();
        this.unloadToolbarButtons();
        window.removeEventListener("resize", this.onResize);
        for (var i = 0, len = this.views.length; i < len; i++) {
            this.views[i].destroy(); 
        }
        console.log(cacheStatusInfo);
        statusInfoPanel.innerText = cacheStatusInfo;
        if (this.onDestroyed) {
            this.onDestroyed();
        }
        this.remove();
        this.views = [];
        this.$el = null;
        this.parent = null;
        this.pane = null;
    };
    
    Panel.prototype.hide = function() {
        if (this.pane) {
            this.showSidebar();
            _showCurrentEditor();
            this.pane.hide();
        }
    };
    
    exports.ComparePanel = Panel;
});
