var http = require("http");
var httpProxy = require("http-proxy");
var proxy = httpProxy.createProxyServer({});
var cluster = require("cluster");
var numCPUs = require('os').cpus().length;
var conf = require('./conf.js');

var server = http.createServer(function (req, res) {
    var host = req.headers.host;
    var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    console.log(`your ip is ${ip}，host is ${host}`);
    if (host in conf) {
        proxy.web(req, res, {
            target: conf[host]
        });
    } else {
        res.writeHead(200, {
            "Content-Type": "text/plain"
        });
        res.end("Node.js");
    }
});

server.on("error", function (req, res) {
    res.writeHead(500, {
        "Content-Type": "text/plain"
    });
    res.end("Something was wrong ... ");
});

// 监控程序
if (cluster.isMaster) {
    // console.log(`Master ${process.pid} is running`);
    // Fork workers.
    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
        cluster.fork();
        console.log(`Worker ${process.pid} restarted`);
    });
} else {
    // Workers can share any TCP connection
    // In this case it is an HTTP server
    server.listen(80);
    console.log(`Worker ${process.pid} started`);
}