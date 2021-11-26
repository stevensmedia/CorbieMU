import * as asserts from "https://deno.land/std@0.115.1/testing/asserts.ts"

import corbie from "./corbie/mod.js"

Deno.test("starts", async function() {
	const server = new corbie.parliament()
	server.start()
	await server.close()
})

Deno.test("handles GET /", async function() {
	const server = new corbie.parliament()
	server.start()

	var response = await fetch("http://localhost:8080/")
	asserts.assert(response.ok, "is ok")
	asserts.assert(response.status == 200, "is 200")
	asserts.assert(response.text(), "has text")

	await server.close()
})

Deno.test("404s", async function() {
	const server = new corbie.parliament()
	server.start()

	var response = await fetch("http://localhost:8080/😎")
	asserts.assert(!response.ok, "is not ok")
	asserts.assert(response.status == 404, "is 404")
	asserts.assert(response.text(), "has text")

	await server.close()
})

Deno.test("400s on bad POST /post/", async function() {
	const server = new corbie.parliament()
	server.start()

	const fetchOpts = {
		method: "POST"
	}
	var response = await fetch("http://localhost:8080/post/", fetchOpts)
	await server.close()

	asserts.assert(!response.ok, "is not ok")
	asserts.assert(response.status == 400, "is 400")
	const json = await (async () => { try { return await response.json() } catch { fail("response.json") } })()
	asserts.assert(json, "has json")
	asserts.assert(json.error, "has json error")

})

Deno.test("accepts POST /post/", async function() {
	const server = new corbie.parliament()
	server.start()

	const fetchOpts = {
		method: "POST",
		body: "{}",
		headers: {
			"content-type": "application/json"
		}
	}
	var response = await fetch("http://localhost:8080/post/", fetchOpts)
	await server.close()

	asserts.assert(response.ok, "is ok")
	asserts.assert(response.status == 200, "is 200")
	const json = await (async () => { try { return await response.json() } catch { fail("response.json") } })()
	asserts.assert(json, "has json")
	asserts.assert(!json.error, "has no json error")
	asserts.assert(json.result, "has json result")

})
