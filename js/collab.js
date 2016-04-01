define(['socket.io-client/socket.io'] , function (io) {

    'use strict';
    var collab = {},
        socket = null,
        callbackOnMessage = function(){};

    collab.init = function(activityName){
        socket = io.connect('http://localhost:3000');

        socket.on('hello', function(data){
            console.log(data);
        });

        var client = {
            'name' : 'Jon Snow',
            'activity' : activityName
        };

        socket.emit('initiate',{client:client});

        socket.on('broadcast',function(data){
            //console.log(data);
            callbackOnMessage(data);
        });
    };

    

    collab.sendMessage = function(data,callback){
        socket.emit('message', data,function(err){
            callback();
        });
    };

    collab.onReceive = function(callback){
        callbackOnMessage = callback;
    }

    return collab;
    
});
