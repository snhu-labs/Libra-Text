var http = require('http');
var WebSocketServer = require('websocket').server;
var User = require('./user').User;
var DashUser = require('./dashUser').DashUser;
var InstanceServer = require('./instance').InstanceServer;
var address = 'internal IP of EC2 instance';
var port = 9701;
var acceptableOrigin = ["list of acceptable origins goes here"];
var msgTypes = {
    'DEFAULT': 0,       // Catch-all event
    'INIT': 1           // Initializes connection with username and classcode
};
var clientConnections = [];
var runningInstances = [];

var server = http.createServer((request, response) => {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

server.listen(port, address, () => {
    console.log(`${(new Date())}: Server is listening on port ${port}`);
});

var wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

wsServer.on('upgradeError', (err) => {
    console.log("upgradeError", err);
});

wsServer.on('request', OnClientSocketRequest);

function OriginIsAllowed(origin) {
    for(let o = 0; o < acceptableOrigin.length; o++) {
        if(origin.includes(acceptableOrigin[o])) {
            return true;
        }
    }
    return false;
}

function OnClientSocketRequest(request) {
    if (!OriginIsAllowed(request.origin)) {
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }

    // Check cc/un in servers to see if user is allowed/exists
    let params = GetParamsArray(request.httpRequest.url);
    let serverExists = ServerExists(params.cc);
    let hasUser = false;

    if(params.dash !== null && params.dash !== undefined && params.dash === '1') {
        CreateDashboard(request, params.cc, params.un);
    } else {
        // if user is in clientConnections pool
        for(let c = 0; c < clientConnections.length; c++) {
            if(clientConnections[c].username === params.un &&
            clientConnections[c].fullcode === params.cc) {
                hasUser = FindServer(clientConnections[c].fullcode).HasUser(clientConnections[c]);
                if(serverExists && hasUser) {
                    ReconnectUser(request, c);
                    return;
                }
            }
        }
        CreateUser(request, params.cc, params.un);
    }
}

function ReconnectUser(request, connIdx) {
    console.log("user is rejoining- reconnecting...", clientConnections[connIdx].slot);
    let server = FindServer(clientConnections[connIdx].fullcode);
    clientConnections[connIdx].connection = request.accept(null, request.origin);
    clientConnections[connIdx].connection.parent = clientConnections[connIdx];
    clientConnections[connIdx].connection.on('message', clientConnections[connIdx].OnDataReceived);
    clientConnections[connIdx].connection.on('close', clientConnections[connIdx].OnSocketClosed);
    server.ReconnectUser(clientConnections[connIdx]);
}

function CreateUser(request, cc, un, init = true) {
    console.log(`Connection to ${cc} for ${un} from ${request.origin} accepted...`);

    let user = new User(request.accept(null, request.origin), cc, un);
    user.connection.on('message', user.OnDataReceived);
    user.connection.on('close', user.OnSocketClosed);

    clientConnections.push(user);

    if(init) {
        user.BeginInit();
    }

    return user;
}

function CreateDashboard(request, cc, un, init = true) {
    console.log(`Dashboard connection to ${cc} for ${un} from ${request.origin} accepted...`);

    let dash = new DashUser(request.accept(null, request.origin), cc, un);
    dash.connection.on('message', dash.OnDataReceived);
    dash.connection.on('close', dash.OnSocketClosed);

    clientConnections.push(dash);

    if(init) {
        dash.BeginInit();
    }

    return dash;
}

function GetParamsArray(path) {
    let args = path.split('&'[0]);
    let result = {};
    for(let a = 0; a < args.length; a++) {
        if(args[a].indexOf('/?') === 0) {
            args[a] = args[a].substr(2);
        }
        let subargs = args[a].split('=');
        result[subargs[0]] = subargs[1];
    }

    return result;
}

function ServerExists(classcode) {
    if(runningInstances[classcode] !== null &&
        runningInstances[classcode] !== undefined) {
            return true;
    }
    return false;
}

global.FindServer = function(classcode) {
    if(runningInstances[classcode] !== null &&
        runningInstances[classcode] !== undefined) {
    } else {
        console.log(`Creating server for ${classcode}`);
        runningInstances[classcode] = new InstanceServer(classcode);
    }
    return runningInstances[classcode];
}

function OnClientSocketDataReceived(message) {
    let data = JSON.parse(message.utf8Data);
    switch(data.type) {
        default:
        case msgTypes.DEFAULT:
            console.log(`Route to ${data.classcode.toString().substr(0, 2)} with ${data}`);
            break;
    }
}

function OnClientSocketClose(reasonCode, description) {
    console.log("Client has disconnected");
}

exports.FindServer = FindServer;