Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    launch: function() {
        //Write app code here
        console.log('Brian Watson: custom app');
        //API Docs: https://help.rallydev.com/apps/2.0/doc/

        //Container to house pulldowns.  Can update containers for formatting
        this.pulldownContainer = Ext.create('Ext.container.Container',
            {
                layout:{
                    type: 'hbox'
                }
            }    
        );
    
        this.add(this.pulldownContainer);

        this._loadProjectStore();
        
        this._addPrintButton();
    },
    
_onClickExport: function () { //using this function to export to csv

     if (document.getElementById('grid_box')) {

        //Ext.getBody().mask('Exporting Tasks...');
        console.log('inside export');
        setTimeout(function () {
            var template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-' +
                'microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head>' +
                '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>' +
                '{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>' +
                '</x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}' +
                '</table></body></html>';

            var base64 = function (s) {
                return window.btoa(unescape(encodeURIComponent(s)));
            };
            var format = function (s, c) {
                return s.replace(/\{(\w+)\}/g, function (m, p) {
                    return c[p];
                });
            };
            var table = document.getElementById('grid_box');
            console.log("Exporting table ",table);
            var excel_data = '<tr>';
            Ext.Array.each(table.innerHTML.match(/<span .*?x-column-header-text.*?>.*?<\/span>/gm), function (column_header_span) {
                excel_data += (column_header_span.replace(/span/g, 'td'));
            });
            excel_data += '</tr>';
            Ext.Array.each(table.innerHTML.match(/<tr class="x-grid-row.*?<\/tr>/gm), function (line) {
                excel_data += line.replace(/[^\011\012\015\040-\177]/g, '>>');
            });
            console.log("Excel data ",excel_data);
            var ctx = {worksheet: name || 'Worksheet', table: excel_data};
            window.location.href = 'data:application/vnd.ms-excel;base64,' + base64(format(template, ctx));
            Ext.getBody().unmask();
        }, 500);
    }else{
        console.log("grid_box does not exist");
    }
},

_addPrintButton: function() {
    this.add(Ext.create('Ext.Container', {
        items: [{
            xtype: 'rallybutton',
            text: 'Click me',
            disabled: false,
            scope: this,
            handler: function(){
                console.log('In Handler of button click');
                this._onClickExport();
            }
        }]
        //renderTo: Ext.getBody().dom
    }));
},

_loadProjectStore: function(){

    var projectFilters = [
            {
               property:'Name',
               operation:'=',
               value:'A/R/I/VP'
           }
    ];

    //Load Projects
    var myProjectStore = Ext.create('Rally.data.wsapi.Store', {
       model: 'Project',
       autoLoad: true,
       fetch: ['Name'],
       //filters: projectFilters,
        sorters:[{
            property: 'Name',
            direction: 'ASC'
        }
        ]
    });

    console.log('myProjectStore', myProjectStore);

    this._loadProjectComboBox(myProjectStore);
   },

    _loadStore: function() {

        //pull reference from selected value on ProjectComboBox
        var selectedProject = this.myProjectComboBox.getRecord().get('_ref');
        console.log('User Selected Project', selectedProject, '[Name=', this.myProjectComboBox.getRecord().get('Name'), ']');

        //array of filters
        var storeFilters = [{
                property: 'Project',
                operation: "=",
                value: selectedProject
        }];

        //Store
        if(this.myDataStore){
            console.log('Using myDataStore in memory', this.myDataStore.count());
            this.myDataStore.clearFilter();                 //clear old filters
            this.myDataStore.addFilter(storeFilters, true); //set new filters
            this.myDataStore.load();                        //reload data
        }else{
            console.log('creating new myDataStore');
            this.myDataStore = Ext.create('Rally.data.wsapi.Store', {
                model: 'UserIterationCapacity',
                autoLoad: true,
                //filters: storeFilters,
                listeners: {
                    scope: this,
                    load: function(store, data, success) {
                        //process data
                        console.log('myDataStore Data', store, data, success);

                        if(!this.myGrid){
                            //load the grid
                            this._createGrid(store);
                        }
                    }
                },
                fetch: ['User', 'Project', 'Capacity', 'Iteration']
            });
        }
        //Store
    },

    _createGrid: function(myStore){
        //Grid
        this.myGrid = Ext.create('Rally.ui.grid.Grid', {
           store: myStore,
           itemId: 'grid_box',
           columnCfgs: ['User', 'Project', 'Capacity', 'Iteration'] /*,
           plugins: [
                            {
                                ptype: 'rallygridboardactionsmenu',
                                menuItems: [
                                    {
                                        text: 'Export...',
                                        handler: function() {
                                            //window.location = _loadCsvFunction();
                                        },
                                        scope: this
                                    }
                                ],
                                buttonConfig: {
                                    iconCls: 'icon-export'
                                }
                            }
            ]*/
         });
        this.add(this.myGrid);
        console.log('MyGrid', this.myGrid);
        //Grid
    },

    _loadProjectComboBox: function(myStore){
        this.myProjectComboBox = Ext.create('Rally.ui.combobox.ComboBox', {
            store: myStore,
            fieldLabel: 'Project (aka Team)',
            labelAlign: 'Right',
            width: 300,
            forceSelection: true,
            success: function(){
                console.log('_loadProjectComboBox.myProjectComboBox', this.myProjectComboBox);
            },
            listeners: {
                ready: function(combobox){
                    console.log('Listening on ProjectComboBox');
                    this._loadStore();
                },
                select: function(combo, records, eOpts){
                    console.log('User selected event on Project Combo Box');
                    this._loadStore();
                },
            scope:this
            }
        });

        this.pulldownContainer.add(this.myProjectComboBox);

    }/*,
    
    _loadCsvFunction(){
        Ext.define('Rally.ui.grid.GridCsvExport', {
        requires: ['Rally.data.wsapi.Filter'],
        singleton: true,

        buildCsvExportUrl: function (grid) {
            grid = this.myGrid;
            
            var params = {},
                store = grid.store;

            var fetch = "FormattedID," + _.map(grid.columnCfgs, function (config) {
                return config.dataIndex || config;
            }).join();

            var filter =  _(store.filters.items)
                .map(function(filter) {
                    return filter instanceof Rally.data.wsapi.Filter ? filter : Rally.data.wsapi.Filter.fromExtFilter(filter);
                })
                .reduce(function(result, filter) {
                    return result.and(filter);
                }) || '';

            params.order = store.sorters.items[0].property + ' ' + store.sorters.items[0].direction;

            var context = store.context || grid.getContext().getDataContext();
            params.workspace = context.workspace;
            params.project = context.project;
            params.projectScopeDown = context.projectScopeDown;
            params.projectScopeUp = context.projectScopeUp;
            params.fetch = fetch;
            params.query = filter.toString();

            return Rally.environment.getServer().getWsapiUrl() + '/' + store.parentTypes[0] + '.csv?' + Ext.urlEncode(params);
        }
    });
    
    }
*/


});
