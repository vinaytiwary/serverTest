var Demo = Demo || {};
Demo.config = {
    /* specify the IP adress and port number of unserver */
    unserverUrl: 'http://localhost:9000',

    /* if set to 'true', the app will try to automatically start
       communicating with unserver when it starts */
    autoConnect: true,

    /* specify properties that will be automatically watched 
       when the app starts */
    properties: [
        'getting-started.test-property',
    ],

    /* specify charts that will be automatically 
       added when the app starts  */
    charts:[
        'getting-started.test-property',
    ],

    /* this function will run after the app starts */
    onReady: function(unserver, app){
        /* write custom code here that you want to run 
           automatically on app start */
    },
}