//Requires
const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')

//DONTCHANGEME - AWS-Serververbindung via SSH Tunnel
var socket = require('socket.io-client')('http://localhost:5000');
require('dotenv').config({ path: '/home/pi/ROBO_CONFIG.cfg' })

//Setup Serialport START
//CHANGEME - Serieller Port zu Arduino
const port = new SerialPort("/dev/ttyACM0", {
	baudRate: 9600
});

port.on('open', () => console.log('Port open, connected to arduino'));

port.on('error', function(err) {
  console.log('Error: ', err.message)
});

const parser = new Readline()
port.pipe(parser)
//Setup Serialport ENDE

//Variablen
let lastData = "";
let isConnected = false;

//eigener "Raumname" ist aus Robotername und "_control zusammengesetzt"
const ownRoom = "noahbot_control";

//Socket.io Handling - das ist der Kern!
socket.on('connect', function () {

	console.log("Connected to Master");
	isConnected = true;

	// Verbunden, registiere für jeweiligen Bot-"Raum"
	socket.emit('register_bot', {
		room: ownRoom,
		port: process.env.CAMPORT
	});

	// Eingehende Serialevents an zentralen SIO Server senden (für Debugging etc.)
	// parser.on('data', line => {
	// 	// console.log(`> ${line}`);
	// 	if (line != lastData) {
	// 		// socket.to(ownRoom).emit("serialresponse", line);
	// 		lastData = line;
	// 	}
	// })

	parser.on('data', console.log);

	// Eingehende SIO Events an serialport via Arduino weiterleiten
	// socket.on('serialevent', function (data) {
	// 	port.write(data.toString())
	// 	console.log("Wrote " + data);
	// });

	// CHANGEME - Hier könnte eure eigene Logik stehen, nur ein Beispiel ----------
	//

	socket.on("move", function(data) {
		var msg = "m" + data.toString() + "\n";
		var time = new Date();
		var timeString = time.getHours() + ":" + time.getMinutes();
		console.log(timeString + " - Message: " + msg);
		port.write(msg, function(err) {
			if (err) {
				return console.log('Error on write: ', err.message)
			}
			console.log('message "' + msg + '" written')
		})
	})


	//
	// Beispiel Ende --------------------------------------------------------------

	//Verbindungsabbruch handhaben
	socket.on('disconnect', function () {
		isConnected = false;
		console.log("Disconnected");
	});
});
