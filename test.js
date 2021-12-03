import * as asserts from "https://deno.land/std@0.115.1/testing/asserts.ts"

import corbie from "./corbie/mod.js"

const hostname = 'localhost'
const port = 42010
const baseURI = `http://${hostname}:${port}`

function startup() {
	const tree = new corbie.tree()

	/*
	tree.on("Log", function(...args) {
		console.log("\nLOG:", ...args)
	})
	*/

	const server = new corbie.parliament(tree, {
		hostname: hostname,
		port: port
	})
	server.start()
	return server
}

Deno.test("creates tree", function() {
	const tree = new corbie.tree()
})

Deno.test("sends and receives messages", async function() {
	await new Promise((resolve, reject) => {
		const tree = new corbie.tree()

		tree.on("test message", function() {
			resolve()
		})

		tree.emit("test message")
	})
})

Deno.test("starts", async function() {
	const server = startup()
	await server.close()
})

Deno.test("handles GET /", async function() {
	const server = startup()

	var response = await fetch(baseURI + "/")
	asserts.assert(response.ok, "is ok")
	asserts.assert(response.status == 200, "is 200")
	asserts.assert(response.text(), "has text")

	await server.close()
})

Deno.test("404s", async function() {
	const server = startup()

	var response = await fetch(baseURI + "/😎")
	asserts.assert(!response.ok, "is not ok")
	asserts.assert(response.status == 404, "is 404")
	asserts.assert(response.text(), "has text")

	await server.close()
})

Deno.test("400s on bad POST /post/", async function() {
	const server = startup()

	const fetchOpts = {
		method: "POST"
	}
	var response = await fetch(baseURI + "/post/", fetchOpts)
	await server.close()

	asserts.assert(!response.ok, "is not ok")
	asserts.assert(response.status == 400, "is 400")
	const json = await (async () => { try { return await response.json() } catch { asserts.fail("response.json") } })()
	asserts.assert(json, "has json")
	asserts.assert(json.error, "has json error")

})

Deno.test("accepts POST /post/", async function() {
	const server = startup()

	const fetchOpts = {
		method: "POST",
		body: "{}",
		headers: {
			"content-type": "application/json"
		}
	}
	var response = await fetch(baseURI + "/post/", fetchOpts)
	await server.close()

	asserts.assert(response.ok, "is ok")
	asserts.assert(response.status == 200, "is 200")
	const json = await (async () => { try { return await response.json() } catch { asserts.fail("response.json") } })()
	asserts.assert(json, "has json")
	asserts.assert(!json.error, "has no json error")
	asserts.assert(json.result, "has json result")
})

Deno.test("accepts WebSocket connection", function() {
	return new Promise(function(resolve, reject) {
		const server = startup()

		const ws = new WebSocket('ws://localhost:8080/socket/')
		ws.onopen = () => ws.send('{"foo":"true"}')
		ws.onclose = async () => { await server.close(); resolve() }
		ws.onmessage = async function(m) {
			asserts.assert(m.data, "returns data")
			const json = (() => { try { return JSON.parse(m.data) } catch { asserts.fail("m.data is JSON") } })()
			asserts.assert(json.status == "online", "status is online")
			ws.close()
		}
	})
})

Deno.test("runs softcode", async function() {
	const tree = new corbie.tree()
	const nest = new corbie.nest(tree, {})
	var ret = await nest.execAs(undefined, '2 + 2')
	asserts.assert(ret.Value.number == 4, "Returned correct value")
})

Deno.test("terminates runaway softcode", async function() {
	const tree = new corbie.tree()
	const nest = new corbie.nest(tree, {})
	try {
		await nest.execAs(undefined, 'while(true) { continue }')
		asserts.fail("Did not throw!")
	} catch(e) {
		asserts.assert(e.message == "Terminated", "Terminated error")
	}
})
