import corbie from "./corbie/mod.js"

corbie.tree().on("Log", function(...args) {
	console.log("LOG:", ...args)
})

corbie.tree().on("Debug", function(...args) {
	console.info("DEBUG:", ...args)
})

corbie.tree().on("Packet", function(packet) {
	corbie.tree().emit("Log", "Received packet!", JSON.stringify(packet))
})

const server = new corbie.parliament()
server.start()
await server.close()
