(function(global, Chartist, config){
    PropertyOverTimeChartVM = (function(Chartist){
        function ctor(address){
            var self = this;
            var chartWindow = 60;
            var refreshInterval = 1000;
            var point = undefined;

            self.labels = [
                "-60s",null,null,null,null,null,null,null,null,null,
                "-50s",null,null,null,null,null,null,null,null,null,
                "-40s",null,null,null,null,null,null,null,null,null,
                "-30s",null,null,null,null,null,null,null,null,null,
                "-20s",null,null,null,null,null,null,null,null,null,
                "-10s",null,null,null,null,null,null,null,null,null
            ];
            self.series = [Array(60)];

            function addPoint(value){
                point = value;
            }

            function drawPoint(){
                self.series[0].push(point);
                if(self.series[0].length > chartWindow){
                    self.series[0].shift();               
                }
                point = null;
            }

            function tick(){
                drawPoint();
                setTimeout(tick, refreshInterval);
            }

            tick();
            return {
                address:address,
                addPoint: addPoint,
                labels: self.labels,
                series: self.series
            }
        }
        return ctor;
    })(Chartist);

    var unserver = new Unserver();

    Vue.component('property-chart', {
        props:['labels', 'series', 'address'],
        template: '<div v-bind:id="id" class="ct-chart ct-octave">'+
                    '<span>{{address}}</span>'+
                    '<input type="hidden" v-bind:value="series[0].length"/>'+
                '</div>',
        data: function () {
            return {
                chart: undefined,
                id: 'chart-' + new Date().getUTCMilliseconds(),
            }
        },
        mounted: function(){
            this.chart = Chartist.Line('#'+this.id, {labels:this.labels, series:this.series});
        },
        updated: function(){
            this.chart.update({labels:this.labels, series:this.series})
        }
    })

    var app = new Vue({
        el:'#root',
        data:{
            server: config ? config.unserverUrl : 'http://localhost:9000',
            unserver: unserver,
            properties: [
            ],
            propertyInput:'',
            isConnected: false,
            comError: false,
            comOk: false,
            charts:[
            ]
        },
        computed:{
            isPropertyInputValid: function(){
                var address = this.propertyInput.split('.');
                return address.length === 2 && address[0].length > 0 && address[1].length > 0;
            },
            comStatus: function(){
                if(this.isConnected && this.comError)
                    return 'error';
                if(this.isConnected && this.comOk)
                    return 'ok';
                return 'none';
            }
        },
        methods:{
            addChart:function(address){
                if(this.charts.find(function(x){return x.address === address})){
                    return;
                }
                var chart = new PropertyOverTimeChartVM(address);
                this.charts.push(chart);

                var tag = address.split('.')[0];
                var property = address.split('.')[1];

                unserver.watchProperty(tag, property, chart.addPoint);
            },
            removeChart:function(chart){
                var list = this.charts;
                list.splice(list.indexOf(list.find(function(x){ return x === chart; })), 1);
            },
            toggleConnection: function(){
                if(this.isConnected){
                    unserver.stop();
                    this.isConnected = false;
                    this.comError = false;
                    this.comOk = false;
                }
                else{
                    unserver.start(this.server, 1000);
                    this.isConnected = true;
                    this.comError = false;
                    this.comOk = false;
                }
            },
            add: function(){
                this.addProperty(this.propertyInput);
            },
            remove: function(property){
                this.properties.splice(this.properties.indexOf(property), 1);
                unserver.unwatchProperty(property.tag, property.name);
            },
            addProperty: function(propertyAddress){
                var self = this;

                var address = propertyAddress.split('.');
                var tag = address[0];
                var name = address[1];

                self.propertyInput = tag + '.';

                /* do not add property if it's already been added*/
                if (self.properties.find(function(x){return x.id === propertyAddress;})){
                    return;
                }
            
                function updateTagProperties(tagResource, watchedProperties){
                    watchedProperties.forEach(function(p){
                        if (tagResource.name === p.tag){
                            p.value = tagResource.success === true ? tagResource.data[p.name] : null;
                        }
                    })
                }
                var p = { id:propertyAddress, tag:tag, name:name, value:undefined, editOn:false};
                function update(newValue){
                    p.value = newValue;
                    self.comOk = true;
                    self.comError = false;
                }

                self.properties.push(p)

                unserver.watchProperty(tag, name, update);
                unserver.watchError(function(){self.comError = true;})
            },
            edit: function(property){
                property.editOn = true;
                property.editor = p.value;

                var self = this;
                setTimeout(function(){
                    self.$refs.editor.forEach(function(x){
                        x.focus();
                        x.select();
                    });
                }, 100)
            },
            save: function(property){
                if (property.editOn){
                    var p = property;
                    unserver.setProperty(p.tag, p.name, parseFloat(p.editor),
                        function(){
                            self.comOk = true;
                            self.comError = false;
                        }, 
                        function(){
                            self.comError = true;
                        });
                    p.editOn = false;
                    p.editor = '';
                }
            },
        }
    });

    /* Configure app using configuration from config.js */
    if (config){
        config.properties.forEach(function(p){
            app.addProperty(p);
        });
        config.charts && config.charts.forEach(function(c){ app.addChart(c) });
        app.propertyInput = '';
        config.autoConnect && app.toggleConnection();
        config.onReady && config.onReady(app.unserver, app);
    }

    if (config && config.debug){
        global.Demo = global.Demo || {};
        global.Demo.app = app;
    }

})(window, window.Chartist, (window.Demo && window.Demo.config) ? window.Demo.config : null);
