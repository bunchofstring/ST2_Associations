/*
CAVEATS:

## autoLoad in hasMany store configurations
In a hasMany store configuration, setting autoLoad to true will
cause ALL of the foreign keys to be the same. I.e. Ontario's
country_id will be US, when it should be CA. This also makes
the filtering ineffective.
*/

Ext.application({
	launch:function(){

		/*Ensures that the localStorage index contains only unique values*/
		Ext.define('Tester.data.proxy.LocalStorage',{
			override:'Ext.data.proxy.LocalStorage',
			setIds:function(ids){
				var obj = {};
				var arr = [];
				Ext.each(ids,function(id){
					if(obj[id]){return false;}
					obj[id]=true;
					arr.push(id);
				});
				this.callParent([arr]);
			}
		});

		/*Allows us to use the idProperty as documented. The data source (server, inline, etc.) must have a uniqueness constraint on the selected property.*/
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
		
		/*Country model definition*/
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
						proxy:{
							id:'Province',
							type:'localstorage',
						}
					}
				}
			}
		});
		
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
		
		/*Country store which contains a collection of Country models*/
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
		
		/*Province store which contains the full collection of Province models, regardless of their parent Country*/
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
		
		/*Displays the tester interface*/
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
					
						var associatedModelsInLocalStorage = (localStorage['Country-US'] && localStorage['Province-ON']) ? '<span style=\'color:green\'>Passed</span>' : '<span style=\'color:red\'>Failed</span>';
						container.add({xtype:'container',margin:'0.5em 2em',html:'1. Associated Models in localStorage: '+associatedModelsInLocalStorage});
						
						var associatedLocalStorageIndexManaged = (localStorage['Province'].split(',').length == 3) ? '<span style=\'color:green\'>Passed</span>' : '<span style=\'color:red\'>Failed</span>';
						container.add({xtype:'container',margin:'0.5em 2em',html:'2. Managed Associated localStorage Index: '+associatedLocalStorageIndexManaged});
						
						var associatedStoreFiltered = (Ext.getStore('Country').getById('US').provinces().getCount() == 2) ? '<span style=\'color:green\'>Passed</span>' : '<span style=\'color:red\'>Failed</span>';
						container.add({xtype:'container',margin:'0.5em 2em',html:'3. Filter Associated Store: '+associatedStoreFiltered});
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