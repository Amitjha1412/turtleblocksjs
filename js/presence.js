function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}
var username = randomString(10, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
var ntId = randomString(5, '0123456789');
var initialMessage = {name : username, networkId : ntId, colorValue : {stroke : "#5E008C", fill : "#FF8F00"}};

var getType = function(type){
	switch(type){
		case "msgInit":
			return 0;
		case "msgListUsers":
			return 1;
		case "msgCreateSharedActivity":
			return 2;
		case "msgListSharedActivities":
			return 3;
		case "msgJoinSharedActivity":
			return 4;
		case "msgLeaveSharedActivity":
			return 5;
		case "msgOnConnectionClosed":
			return 6;
		case "msgOnSharedActivityUserChanged":
			return 7;
		case "msgSendMessage":
			return 8;
	}
}

var groupId = null;
var shared = 0;

define(function (require) {
    //var activity = require("activity");
    var collab = require('activity/collab');

    // Manipulate the DOM only when it is ready.
    require(['domReady!'], function (doc) {

        // Initialize the activity.
        //activity.setup();
        var activityName = 'splash';
        collab.init(activityName);

        var input = document.getElementById('splashInput');
        var button = document.getElementById('splashButton');
        var wall = document.getElementById('wall');
        function sendMessage(){
        	collab.sendMessage(input.value);
        	input.value = "";
        };

        button.onclick = sendMessage;

        collab.onReceive(function(data){
        	console.log(data);
        	var msg = data.msg;
			var author = data.user.replace('<','&lt;').replace('>','&gt;');
			var authorElem = '<span style = "color:#24edff">' + author + '</span>';
			var myElem = document.createElement('li');
			myElem.innerHTML = authorElem + msg;
			wall.appendChild(myElem);
		});

    });

});


function SugarPresence(loadRawProject,saveLocally,turtles,blocks){
	this.loadRawProject = loadRawProject;
	this.saveLocally = saveLocally;
	this.peers = [];
	this.turtles = turtles;
	this.blocks = blocks;
	this.socket = new WebSocket("ws://server.sugarizer.org:8039");
	this.socket.onopen = function(){
		alert("Connected to the server");
		me.socket.send(JSON.stringify(initialMessage));
		//console.log(initialMessage.name);
	}

	var me = this;

	this.socket.onmessage = function(evt){
		var res = JSON.parse(evt.data);

		switch(res.type){
			case getType("msgCreateSharedActivity") :
				groupId = res.data;
				shared = 1;
				break;
			case getType("msgListSharedActivities") :
				me.fillContentInShare(res);
				break;
			case getType("msgJoinSharedActivity") :
				groupId = res.data.id;
				break;
			case getType("msgSendMessage") :
				if(res.data.user.networkId != ntId){
					var user = res.data.user;
					var tid = me.getTurtleList(user);
					if(tid == null){
						console.log("inside if");
					}
					else {
						console.log("Inside else");
						for(var i in tid){
							var myBlock = tid[i].startBlock;
							sendStackToTrash(me.blocks,myBlock);
						}
					}
					var currentTurtles = turtles.turtleList;
					var prelen = currentTurtles.length;
					me.loadRawProject(res.data.content);
					var peerTurtles = [];
					setTimeout(function(){
						var afterLoadTurtles = turtles.turtleList;
						var j = 0;
						for(var i in afterLoadTurtles){
							if(j < prelen){
								j++;
								continue;
							}
							else {
								peerTurtles.push(afterLoadTurtles[i]);
							}
							j++;
						}
						for(var i in me.peers){
							if(me.peers[i].user.networkId == res.data.user.networkId){
								for(var j in peerTurtles){
									me.peers[i].turtleList.push(peerTurtles[j]);
								}
							}
							else {
								var peerdata = { user : res.data.user, turtleList : []};
								for(var j in peerTurtles){
									peerdata.turtleList.push(peerTurtles[j]);
								}
								me.peers.push(peerdata);
							}
						}
					},500); 
				}
				
				
				break;
			case getType("msgOnSharedActivityUserChanged") :
				var peerdata = { user : res.data.user, turtleList : []};
				if(res.data.move == -1){

				}
				else {
					me.peers.push(peerdata);
				}
				
				break;
		}
	}

	this.share = function(){
        var message2 = {type : getType("msgCreateSharedActivity"), activityId : "org.sugarlabs.TurtleBlocks"};
        me.socket.send(JSON.stringify(message2));
	}

	this.sync = function(){
		me.saveLocally();
        var p = localStorage.currentProject;
        var data = localStorage['SESSION' + p];
        me.sendMessage(data);
  		// sendStackToTrash(me.blocks, me.blocks.blockList[0]);
	}

	this.fillContentInShare = function(res){
		var j,k;
		var shareElem = docById('shareElem');
		shareElem.innerHTML = "<p>Present Group : "+groupId+"</p>";
		for(j in res.data){
			shareElem.innerHTML += "<button id='group' class='"+res.data[j].id+"'>"+res.data[j].id+"</button><br />";				
		}
		// $('.group').on('click',groupClick);
		var group = docById('group');
		group.onclick = function(){
			me.groupClick(this);
		}
	}

	this.sendRequestToListGroups = function(){
		me.socket.send(JSON.stringify({type : getType("msgListSharedActivities")}));
	}

	this.groupClick = function(that){
		
		var group = that.getAttribute('class');
		// alert(group);
		var msg = {type : getType("msgJoinSharedActivity"), group : group};
		me.socket.send(JSON.stringify(msg));
	}

	this.sendMessage = function(data){
		var msg3 = {type : getType("msgSendMessage"), group : groupId, data : {user : initialMessage , content : data}};
		me.socket.send(JSON.stringify(msg3));
	}

	this.getTurtleList = function(user){
		for(var i in me.peers){
			if(me.peers[i].user.networkId == user.networkId){
				return me.peers[i].turtleList;
			}
		}
	}

	this.extractTurtles = function(blockList){
		for(var i in blockList){
			if(blockList[i].name == 'start'){

			}
		}
	}

}

define(function (require) {
	// Message type constants
	var msgInit = 0;
	var msgListUsers = 1;
	var msgCreateSharedActivity = 2;
	var msgListSharedActivities = 3;
	var msgJoinSharedActivity = 4;
	var msgLeaveSharedActivity = 5;
	var msgOnConnectionClosed = 6;
	var msgOnSharedActivityUserChanged = 7;
	var msgSendMessage = 8;
	
	// Array for callbacks on each type
    var callbackArray = [];
	
	// User and shared info storage
	var userInfo = null;
	var sharedInfo = null;

	// Connection object
	function SugarPresence() {
		// Init callbacks
		var emptyCallback = function() {};
		var listUsersCallback = emptyCallback;
		var createSharedActivityCallback = emptyCallback;
		var listSharedActivityCallback = emptyCallback;
		var joinSharedActivity = emptyCallback;
		var leaveSharedActivity = emptyCallback;
		var onConnectionClosed = emptyCallback;
		var onSharedActivityUserChanged = emptyCallback;
		var receivedDataCallback = emptyCallback;
		callbackArray = [emptyCallback, listUsersCallback, createSharedActivityCallback, 
			listSharedActivityCallback, joinSharedActivity, leaveSharedActivity,
			onConnectionClosed, onSharedActivityUserChanged, receivedDataCallback
		];
		this.socket = null;
		
		// Handle message received from server
		this.registerMessageHandler = function() {
			// Get message content
			this.socket.onmessage = function(event) {
				// Convert message to JSON
				var edata = event.data;
				try {
					var json = JSON.parse(edata);
				} catch (e) {
					console.log('Presence API error, this doesn\'t look like a valid JSON: ', edata);
					return;
				}

				// Call the matching callback
				if (json.type < callbackArray.length)
					callbackArray[json.type](json.data);
				else
					console.log('Presence API error, unknown callback type:'+json.type);
			};
		}

		// Register user to the server
		this.registerUser = function() {
			this.socket.send(JSON.stringify(this.userInfo));
		}    

	}

	// Create presence object
	var presence = new SugarPresence();
	
	// Test if connected to network
	SugarPresence.prototype.isConnected = function() {
		return (this.socket != null);
	}
	
	// Get user info
	SugarPresence.prototype.getUserInfo = function() {
		return this.userInfo;
	}
	
	// Get shared activity info
	SugarPresence.prototype.getSharedInfo = function() {
		return this.sharedInfo;
	}
	
	// Join network function
    SugarPresence.prototype.joinNetwork = function(callback) {
		// Check WebSocket support
		if (!window.WebSocket){
			console.log('WebSocket not supported');
			callback({code: -1}, presence);			
		}

		// Get server name
		var server = location.hostname;
		if (localStorage.sugar_settings) {
			var sugarSettings = JSON.parse(localStorage.sugar_settings);
			if (sugarSettings.server) {
				server = sugarSettings.server;
				var endName = server.indexOf(':')
				if (endName == -1) endName = server.indexOf('/');
				if (endName == -1) endName = server.length;
				server = server.substring(0, endName);
			}
		}
		
		// Connect to server
        this.socket = new WebSocket('ws://'+server+':8039');
        this.socket.onerror = function(error) {
            console.log('WebSocket Error: ' + error);
			callback(error, presence);
			this.socket = null;
        };
		
		// When connection open, send user info
        var that = this;
        this.socket.onopen = function(event) {
			var sugarSettings = JSON.parse(localStorage.sugar_settings);
			that.userInfo = {
				name: sugarSettings.name,
				networkId: sugarSettings.networkId,
				colorvalue: sugarSettings.colorvalue
			};
			that.registerMessageHandler();
            that.registerUser();
			callback(null, presence);
        };
		
		// When connection closed, call closed callback
        this.socket.onclose = function(event) {
            callbackArray[msgOnConnectionClosed](event);
        };		
    }

	// Leave network
    SugarPresence.prototype.leaveNetwork = function() {
		if (!this.isConnected())
			return;
        this.socket.close();
    }

	// List all users. Will receive an array of users.
    SugarPresence.prototype.listUsers = function(callback) {
		if (!this.isConnected())
			return;

		// Register call back
        callbackArray[msgListUsers] = callback;
		
		// Send list user message
        var sjson = JSON.stringify({
            type: msgListUsers
        });
        this.socket.send(sjson);
    }
	
	// Create a shared activity. Will receive a unique group id.
    SugarPresence.prototype.createSharedActivity = function(activityId, callback) {
		if (!this.isConnected())
			return;

		// Register call back
		var that = this;
        callbackArray[msgCreateSharedActivity] = function(data) {
			that.sharedInfo = { id: data };
			callback(data);
		}
		
		// Send create shared activity message
        var sjson = JSON.stringify({
            type: msgCreateSharedActivity,
			activityId: activityId
        });
        this.socket.send(sjson);
    }

	// List all shared activities. Will receive an array of each shared activities and users connected
    SugarPresence.prototype.listSharedActivities = function(callback) {
		if (!this.isConnected())
			return;

		// Register call back
        callbackArray[msgListSharedActivities] = callback;

		// Send list shared activities message
        var sjson = JSON.stringify({
            type: msgListSharedActivities
        });
        this.socket.send(sjson);
    }
	
	// Join a shared activity. Will receive group properties or null
    SugarPresence.prototype.joinSharedActivity = function(group, callback) {
		if (!this.isConnected())
			return;

		// Register call back
		var that = this;		
        callbackArray[msgJoinSharedActivity] =  function(data) {
			that.sharedInfo = data;
			callback(data);
		}
		
		// Send join shared activity message
        var sjson = JSON.stringify({
            type: msgJoinSharedActivity,
			group: group
        });
        this.socket.send(sjson);
    }

	// Leave shared activities
    SugarPresence.prototype.leaveSharedActivity = function(group, callback) {
		if (!this.isConnected())
			return;

		// Register call back
        callbackArray[msgLeaveSharedActivity] = callback;
		
		// Send leave shared activity message
        var sjson = JSON.stringify({
            type: msgLeaveSharedActivity,
			group: group
        });
        this.socket.send(sjson);
    }

	// Register connection closed event
    SugarPresence.prototype.onConnectionClosed = function(callback) {
        callbackArray[msgOnConnectionClosed] = callback;
    }
	
	// Register shared activity user changed event
	SugarPresence.prototype.onSharedActivityUserChanged = function(callback) {
		callbackArray[msgOnSharedActivityUserChanged] = callback;
	}

	// Send message to a group
    SugarPresence.prototype.sendMessage = function(group, data) {;
		if (!this.isConnected())
			return;
		var sjson = JSON.stringify({
            type: msgSendMessage,
			group: group,
            data: data
        });
        this.socket.send(sjson);
    }
	
	// Register data received message
    SugarPresence.prototype.onDataReceived = function(callback) {
        callbackArray[msgSendMessage] = callback;
    }
	
	return presence;
});

function sendStackToTrash(blocks, myBlock) {
    var thisBlock = blocks.blockList.indexOf(myBlock);
    // disconnect block
    var b = myBlock.connections[0];
    if (b != null) {
        for (var c in blocks.blockList[b].connections) {
            if (blocks.blockList[b].connections[c] == thisBlock) {
                blocks.blockList[b].connections[c] = null;
                break;
            }
        }
        myBlock.connections[0] = null;
    }

    if (myBlock.name == 'start') {
        turtle = myBlock.value;
        if (turtle != null) {
            console.log('putting turtle ' + turtle + ' in the trash');
            blocks.turtles.turtleList[turtle].trash = true;
            blocks.turtles.turtleList[turtle].container.visible = false;
        } else {
            console.log('null turtle');
        }
    }

    if (myBlock.name == 'action') {
        var actionArg = blocks.blockList[myBlock.connections[1]];
        if (actionArg) {
            var actionName = actionArg.value;
            for (var blockId = 0; blockId < blocks.blockList.length; blockId++) {
                var myBlock = blocks.blockList[blockId];
                var blkParent = blocks.blockList[myBlock.connections[0]];
                if (blkParent == null) {
                    continue;
                }
                if (['nameddo', 'do', 'action'].indexOf(blkParent.name) != -1) {
                    continue;
                }
                var blockValue = myBlock.value;
                if (blockValue == _('action')) {
                    continue;
                }
                if (blockValue == actionName) {
                    blkParent.hide();
                    myBlock.hide();
                    myBlock.trash = true;
                    blkParent.trash = true;
                }
            }

            var blockPalette = blocks.palettes.dict['actions'];
            var blockRemoved = false;
            for (var blockId = 0; blockId < blockPalette.protoList.length; blockId++) {
                var block = blockPalette.protoList[blockId];
                // if (block.name == 'do' && block.defaults[0] != _('action') && block.defaults[0] == actionName) {
                if (block.name == 'nameddo' && block.privateData != _('action')) {
                    blockPalette.protoList.splice(blockPalette.protoList.indexOf(block), 1);
                    delete blocks.protoBlockDict['myDo_' + actionName];
                    blockPalette.y = 0;
                    blockRemoved = true;
                }
            }
            // Force an update if a block was removed.
            if (blockRemoved) {
                regeneratePalette(blockPalette);
            }
        }
    }

    // put drag group in trash
    blocks.findDragGroup(thisBlock);
    for (var b = 0; b < blocks.dragGroup.length; b++) {
        var blk = blocks.dragGroup[b];
        console.log('putting ' + blocks.blockList[blk].name + ' in the trash');
        blocks.blockList[blk].trash = true;
        blocks.blockList[blk].hide();
        blocks.refreshCanvas();
    }
}