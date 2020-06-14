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

// let rooms = [
// 	{
// 		id: "1",
// 		name: "Room 1",
// 		people: [
// 			{
// 				id: "1",
// 				nickname: "Marcelo",
// 			},
// 			{
// 				id: "2",
// 				nickname: "João",
// 			},
// 		],
// 	},
// 	{
// 		id: "2",
// 		name: "Room 2",
// 		people: [
// 			{
// 				id: "3",
// 				nickname: "Marcos",
// 			},
// 		],
// 	},
// ];

let rooms = [];

io.on("connection", (socket) => {
	//socket disconected
	socket.on("disconnect", () => handleExitRoom(socket.id));
});

//get specific room indo
app.get("/rooms/:id", (req, res) => {
	const { id } = req.params;
	const room = rooms.find((room) => room.id === id);
	if (room) res.json(room);
	else res.status(404).json({ message: "room not found" });
});

//get rooms info
app.get("/rooms", (req, res) => res.json(rooms));

//enter room
app.post("/rooms/people", (req, res) => {
	const { id, room_id, nickname } = req.body;
	const _room = rooms.find((room) => room.id === room_id);
	if (_room) {
		_room.people.push({ id, nickname });
		res.json(_room);
		io.emit("rooms_changed", rooms);
		io.emit(`${room_id}-changed`, _room);
	} else {
		//room not found
		res.status(404).json({ message: "Room not found." });
	}
});

//send message
app.post("/messages", (req, res) => {
	const { message, sender_id, room_id } = req.body;
	if (message && sender_id && room_id) {
		io.emit(`${room_id}-new_message`, { message, sender_id });
		res.json({ message: "success" });
	} else {
		res.status(400).json({ message: "fail" });
	}
});

//create room
app.post("/rooms", (req, res) => {
	const { name } = req.body;
	if (name) {
		const hash = crypto.randomBytes(6).toString("hex");
		const room = { id: hash, name, people: [] };
		rooms.push(room);
		io.emit("rooms_changed", rooms);
		res.json({ room_id: hash });
	} else {
		res.status(400).json({ message: "fail" });
	}
});

function handleExitRoom(id) {
	for (let j = 0; j < rooms.length; j++) {
		const f_room = rooms[j];
		for (let i = 0; i < f_room.people.length; i++) {
			const f_people = f_room.people[i];
			if (f_people.id === id) {
				f_room.people.splice(i, 1);
				if (f_room.people.length <= 0) {
					rooms.splice(j, 1);
				} else {
					io.emit(`${f_room.id}-changed`, f_room);
				}
				io.emit("rooms_changed", rooms);
				return;
			}
		}
	}
}

server.listen(4001);
