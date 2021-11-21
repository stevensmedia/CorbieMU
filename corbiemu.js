const corbie = await import("./corbie/mod.js")

corbie.tree().on("Log", function(...args) {
	console.log("LOG:", ...args)
})

corbie.tree().on("Packet", function(packet) {
	corbie.tree().emit("Log", "Received packet!", JSON.stringify(packet))
})

corbie.parliament()
