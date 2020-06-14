const express = require("express");
const crypto = require("crypto");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const server = require("http").createServer(app);
const io = require("socket.io")(server);

// let messages: {
// 	room_id: string,
// 	sender_id: string,
// 	message: string
// }[] = [];

// interface Room {
// 	id: String;
// 	name: String;
// 	people: {
// 		id: String,
// 		nickname: String,
// 	}[];
// }

let rooms = [
	{
		id: "1",
		name: "Room 1",
		people: [
			{
				id: "1",
				nickname: "Marcelo",
			},
			{
				id: "2",
				nickname: "João",
			},
		],
	},
	{
		id: "2",
		name: "Room 2",
		people: [
			{
				id: "3",
				nickname: "Marcos",
			},
		],
	},
];

// let rooms = [];

function handleExitRoom(id) {
	for (let j = 0; j < rooms.length; j++) {
		const f_room = rooms[j];
		for (let i = 0; i < f_room.people.length; i++) {
			const f_people = f_room.people[i];
			if (f_people.id === id) {
				f_room.people.splice(i, 1);
				if (f_room.people.length <= 0) {
					rooms.slice(i, 1);
				} else {
					io.emit(`${f_room.id}-changed`, f_room);
				}
				io.emit("rooms_changed", rooms);
				return;
			}
		}
	}
}

io.on("connection", (socket) => {
	//Rooms changed event
	function roomsChanged() {
		socket.broadcast.emit("rooms_changed", rooms);
	}

	//Destroy room if there's no one inside it
	// const checkRoomDestroy = () => {
	// 	for (let i = rooms.length - 1; i >= 0; i--) {
	// 		const f_room = rooms[i];
	// 		if (f_room.people.length <= 0) {
	// 			rooms.slice(i, 1);
	// 			roomsChanged();
	// 		}
	// 	}
	// };

	//Create room event
	// socket.on("create_room", (name) => {
	// 	const hash = crypto.randomBytes(6).toString("hex");
	// 	const room = { id: hash, name, people: [] };
	// 	rooms.push(room);
	// 	roomsChanged();
	// 	socket.emit("room_cheated", room);
	// 	assignRoomEvents(room);
	// });

	// const assignRoomEvents = (room) => {
	// console.log(`assigning events for room ${room.id}`);

	//Enter room event
	// socket.on(`${room.id}-enter_room`, (nickname) => {
	// 	rooms.forEach((f_room) => {
	// 		if (f_room.id === room.id) {
	// 			console.log(`${nickname} entering room ${room.id}`);
	// 			f_room.people.push({ id: socket.id, nickname });
	// 			connected_to_room = f_room.id;
	// 			socket.emit(`${room.id}-info`, room);
	// 			roomsChanged();
	// 		}
	// 	});
	// });

	//Exit room event
	// socket.on(`${room.id}-exit_room`, () => handleExitRoom(room.id));

	//Send message to room event
	// socket.on(`${room.id}-send_message`, (message) => {
	// 	socket.broadcast.emit(`${room.id}-new_message`, {
	// 		sender_id: socket.id,
	// 		message,
	// 	});
	// });
	// };

	// rooms.forEach(assignRoomEvents);

	//socket disconected
	socket.on("disconnect", () => handleExitRoom(socket.id));
});

app.get("/rooms/:id", (req, res) => {
	const { id } = req.params;
	const room = rooms.find((room) => room.id === id);
	if (room) res.json(room);
	else res.status(404).json({ message: "room not found" });
});

app.get("/rooms", (req, res) => res.json(rooms));

app.post("/rooms/people", (req, res) => {
	const { id, room_id, nickname } = req.body;
	const _room = rooms.find((room) => room.id === room_id);
	if (_room) {
		console.log(`${nickname} entering room ${room_id}`);
		_room.people.push({ id, nickname });
		res.json(_room);
		io.emit("rooms_changed", rooms);
		io.emit(`${room_id}-changed`, _room);
	} else {
		//room not found
		res.status(404).json({ message: "Room not found." });
	}
});

server.listen(4001);
