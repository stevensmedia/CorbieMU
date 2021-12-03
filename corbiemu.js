import corbie from "./corbie/mod.js"

const tree = new corbie.tree()
tree.on("Log", function(...args) {
	console.log("LOG:", ...args)
})

tree.on("Debug", function(...args) {
	console.info("DEBUG:", ...args)
})

tree.on("Packet", function(packet) {
	corbie.tree().emit("Log", "Received packet!", JSON.stringify(packet))
})

const server = new corbie.parliament(tree)
server.start()
