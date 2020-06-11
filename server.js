const express = require("express");
const crypto = require("crypto");

const app = express();

const server = require("http").createServer(app);
const io = require("socket.io")(server);

// let messages: {
// 	room_id: string,
// 	sender_id: string,
// 	message: string
// }[] = [];

let rooms = [];

io.on("connection", (socket) => {
	let connected_to_room = "";

	//Send all rooms to clients who connected
	socket.emit("all_rooms", rooms);

	//Rooms changed event
	const roomsChanged = () => socket.broadcast.emit("rooms_changed", rooms);

	//Destroy room if there's no one inside it
	const checkRoomDestroy = () => {
		for (let i = rooms.length - 1; i >= 0; i--) {
			const f_room = rooms[i];
			if (f_room.people.length <= 0) {
				rooms.slice(i, 1);
				roomsChanged();
			}
		}
	};

	const handleExitRoom = (room_id) => {
		if (room_id) {
			rooms.forEach((f_room) => {
				if (f_room.id === room_id) {
					for (let i = 0; i < f_room.people.length; i++) {
						const f_people = f_room.people[i];
						if (f_people.id === socket.id) {
							f_room.people.splice(i, 1);
							connected_to_room = "";
							roomsChanged();
						}
					}
				}
			});
			checkRoomDestroy();
		}
	};

	//Create room event
	socket.on("create_room", (name) => {
		const hash = crypto.randomBytes(6).toString("hex");
		const room = { id: hash, name, people: [] };
		rooms.push(room);
		roomsChanged();
		socket.emit("room_cheated", room);
		assignRoomEvents(room);
	});

	const assignRoomEvents = (room) => {
		//Enter room event
		socket.on(`${room.id}-enter_room`, (nickname) => {
			rooms.forEach((f_room) => {
				if (f_room.id === room.id) {
					f_room.people.push({ id: socket.id, nickname });
					connected_to_room = f_room.id;
					roomsChanged();
				}
			});
		});

		//Exit room event
		socket.on(`${room.id}-exit_room`, () => handleExitRoom(room.id));

		//Send message to room event
		socket.on(`${room.id}-send_message`, (message) => {
			socket.broadcast.emit(`${room.id}-new_message`, {
				sender_id: socket.id,
				message,
			});
		});
	};

	//socket disconected
	socket.on("disconnect", () => handleExitRoom(connected_to_room));
});

server.listen(3000);
