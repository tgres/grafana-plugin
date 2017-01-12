
System.register(["./datasource", "./query_ctrl"], function(_export, _context) {

    var datasource, query_ctrl;

    return {
        setters: [
            function(f) { datasource = f; },
            function(f) { query_ctrl = f; }
        ],
        execute: function() {
            // The main Datasource export, this is what makes it
            // available.
            _export("Datasource", datasource.TgresDatasource);

            // Stuff related to how you add/remove/edit the Datasource
            // itself in the Data Sources panel
            var ConfigCtrl = function() {};
            ConfigCtrl.templateUrl = 'partials/config.html';
            _export("ConfigCtrl", ConfigCtrl);

            // QueryCtrl is required to edit panel metrics
            _export("QueryCtrl", query_ctrl.TgresQueryCtrl);

            // QueryOptionsCtrl is what drives options under the edit
            // metrics such as Cache timeout, stacking, etc.
            var QueryOptionsCtrl = function() {};
            QueryOptionsCtrl.templateUrl = 'partials/query.options.html';
            _export("QueryOptionsCtrl", QueryOptionsCtrl);

            // TODO Annotaions
            // var AnnotationsQueryCtrl = function () {};
            // AnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';
            // _export("AnnotationsQueryCtrl", AnnotationsQueryCtrl);

        }
    };
});
