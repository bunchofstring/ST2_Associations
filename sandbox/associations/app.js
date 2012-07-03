Ext.application({
	launch:function(){
		
		//From janelle: http://www.sencha.com/forum/showthread.php?220305-Problem-with-localstorage-store-and-model-with-hasMany-association&p=838096&viewfull=1#post838096
		//Fixes the foreign key problem as well as the duplicate index values in localStorage. Badass.
		Ext.define('Tester.data.proxy.LocalStorage',{
			override:'Ext.data.proxy.LocalStorage',
			read: function(operation, callback, scope) {
				var records    = [],
					ids        = this.getIds(),
					model      = this.getModel(),
					idProperty = model.getIdProperty(),
					params     = operation.getParams() || {},
					length     = ids.length,
					i, record, filters, tmpRecords = [];
		
				filters = operation.getFilters() || [];
		
				//read a single record
				if (params[idProperty] !== undefined) {
					record = this.getRecord(params[idProperty]);
					if (record) {
						tmpRecords.push(record);
						//operation.setSuccessful();
					}
				} else {
					for (i = 0; i < length; i++) {
						tmpRecords.push(this.getRecord(ids[i]));
						//operation.setSuccessful();
					}
				}
				
				// remove items that dont match filter
				if(filters.length > 0)
				{
					for(i = 0; i < tmpRecords.length; i++)
					{
						var add = true;
						
						for(var x = 0; x < filters.length; x++)
						{
							if(tmpRecords[i].data[filters[x]._property] != filters[x]._value)
							{
								add = false;
							}
						}
						
						if(add)
						{
							records.push(tmpRecords[i]);
						}
					}
				}
				else
				{
					records = tmpRecords;
				}
				
				if(records.length > 0)
				{
					operation.setSuccessful();
				}
		
				operation.setCompleted();
		
				operation.setResultSet(Ext.create('Ext.data.ResultSet', {
					records: records,
					total  : records.length,
					loaded : true
				}));
				operation.setRecords(records);
		
				if (typeof callback == 'function') {
					callback.call(scope || this, operation);
				}
			}
		});

		//Allows us to use the idProperty as documented. The data source (server, inline, etc.) must have a uniqueness constraint on the selected property.
		Ext.define('Ext.data.identifier.Property', {
			alias:'data.identifier.property',
			isUnique:true,
			config:{
				idProperty:''
			},
			constructor:function(config){
				this.initConfig(config);
			},
			generate:function(record){
				return record.get(this.getIdProperty());
			}
		});
		
		//Country model definition with a hasMany association store
		Ext.define('Tester.model.Country',{
			extend:'Ext.data.Model',
			config:{
				fields:[
					{name:'name',type:'string'},
					{name:'abbreviation',type:'string'}
				],
				identifier: {
					type:'property',
					idProperty:'abbreviation'
				},
				hasMany:{
					model:'Tester.model.Province',
					name:'provinces',
					associationKey:'provinces',
					store:{
						autoSync:true,
						autoLoad:true,
						proxy:{
							id:'Province',
							type:'localstorage',
						}
					}
				}
			}
		});
		
		//Province model definition
		Ext.define('Tester.model.Province',{
			extend:'Ext.data.Model',
			config:{
				fields:[
					{name:'name',type:'string'},
					{name:'abbreviation',type:'auto'}
				],
				identifier: {
					type:'property',
					idProperty:'abbreviation'
				},
				belongsTo:'Tester.model.Country',
			}
		});
		
		//Province store which contains the full collection of Province models, regardless of their parent Country
		Ext.create('Ext.data.Store',{
			model:'Tester.model.Province',
			storeId:'Province',
			autoLoad:true,
			autoSync:true,
			proxy:{
				id:'Province',
				type:'localstorage'
			}
		});
		
		//Country store which contains a collection of Country models
		Ext.create('Ext.data.Store',{
			model:'Tester.model.Country',
			storeId:'Country',
			autoLoad:true,
			autoSync:true,
			proxy:{
				id:'Country',
				type:'localstorage'
			},
			data:[
				{
					"name": "Canada",
					"abbreviation": "CA",
					"provinces": [
						{
							"name": "Ontario",
							"abbreviation": "ON"
						}
					]
				},
				{
					"name":"United States",
					"abbreviation":"US",
					"provinces":[
						{
							"name": "California",
							"abbreviation": "CA"
						},
						{
							"name": "Michigan",
							"abbreviation": "MI"
						}
					]
				}
			]
		});
		
		//Displays the tester interface
		Ext.Viewport.add({
			xtype:'container',
			scrollable:true,
			items:[
				{
					xtype:'titlebar',
					title:'Associations Tester',
					docked:'top',
					items:[
						{
							xtype:'button',
							iconMask:true,
							iconCls:'refresh',
							align:'right',
							handler:function(){
								location.reload(true);
							}
						}
					]
				},
				{
					xtype:'container',
					docked:'top',
					html:'<b>Instructions:</b> To re-run the test after changing some code, click the big green button at the bottom. To prove some of the test cases, you will need to refresh the page using your browser controls or the shortcut to the right of the title.',
					margin:'1em'
				},
				{
					xtype:'button',
					ui:'confirm',
					margin:'1em',
					height:'4em',
					text:'Clear localStorage and Refresh',
					docked:'bottom',
					handler:function(){
						localStorage.clear();
						location.reload(true);
					}
				}
			],
			listeners:{
				painted:function(container){
					var addValidationResults = function(){
						
						//Test 1: Verify that both the parent and child records are stored in localStorage
						var associatedModelsInLocalStorage = (localStorage['Country-US'] && localStorage['Province-ON']) ? '<span style=\'color:green\'>Passed</span>' : '<span style=\'color:red\'>Failed</span>';
						container.add({xtype:'container',margin:'0.5em 2em',html:'1. Associated Models in localStorage: '+associatedModelsInLocalStorage});
						
						//Test 1: Verify that both the parent and child records are stored in localStorage
						Ext.getStore('Province').load();
						var associatedLocalStorageIndexManaged = (localStorage['Province'].split(',').length == Ext.getStore('Province').getCount()) ? '<span style=\'color:green\'>Passed</span>' : '<span style=\'color:red\'>Failed</span>';
						container.add({xtype:'container',margin:'0.5em 2em',html:'2. Managed Associated localStorage Index: '+associatedLocalStorageIndexManaged});
						
						var usProvincesCount = Ext.getStore('Country').getById('CA').provinces().getCount();
						var usProvincesCount2 = Ext.getStore('Province').queryBy(function(record){
							return (record.get('country_id') == 'CA');
						}).getCount();
						var associatedStoreFiltered = (usProvincesCount == usProvincesCount2) ? '<span style=\'color:green\'>Passed</span>' : '<span style=\'color:red\'>Failed</span>';
						container.add({xtype:'container',margin:'0.5em 2em',html:'3. Filter Associated Store: '+associatedStoreFiltered});
						
						//Here we add New York to the associated store and see if the overall store picks up the addition
						var associatedProvinceStore = Ext.getStore('Country').getById('US').provinces();
						var addRecordArtifact = associatedProvinceStore.getById('NY');
						if(addRecordArtifact){
							associatedProvinceStore.remove(addRecordArtifact);
//Need to build this into the CRUD operations of associated stores. On updaterecord and on write don't work because the handlers don't trigger immediately. They seem to be asynchronous-like
							Ext.getStore('Province').load();
						}
						Ext.getStore('Province').load();
						var countBeforeAdd = Ext.getStore('Province').getCount();
						associatedProvinceStore.add({abbreviation:'NY',name:'New York'});
//Need to build this into the CRUD operations of associated stores. On updaterecord and on write don't work because the handlers don't trigger immediately. They seem to be asynchronous-like
						Ext.getStore('Province').load();
						var countAfterAdd = Ext.getStore('Province').getCount();
						var associatedStoreAdditionsPropagate = (countAfterAdd == countBeforeAdd+1) ? '<span style=\'color:green\'>Passed</span>' : '<span style=\'color:red\'>Failed</span>';
						container.add({xtype:'container',margin:'0.5em 2em',html:'4. Additions to Associated Stores Propagate: '+associatedStoreAdditionsPropagate});
					};
					
					if(Ext.getStore('Country').isLoaded()){
						addValidationResults();
					}else{
						Ext.getStore('Country').on('load',addValidationResults);
					}
				}
			}
		});
	}
});