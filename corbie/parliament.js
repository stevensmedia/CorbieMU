import tree from "./tree.js"
import * as server from "https://deno.land/std@0.116.0/http/server.ts";

const decoder = new TextDecoder("utf8")

async function readStream(stream) {
	const reader = stream.getReader()
	var buf = false
	do {
		var res = await reader.read()
		if(!buf) {
			buf = res.value
		} else {
			if(res.value) {
				buf = buf.concat(res.value)
			}
		}
	} while(!res.done)
	return decoder.decode(buf)
}

function log(conn, req, status) {
	tree().emit("Log", `Parliament ${conn.remoteAddr.transport}/${conn.remoteAddr.hostname}:${conn.remoteAddr.port} ${status} ${req.method} ${req.url}`)
}

async function request404(conn, req, headers) {
	const body = "<html><head><title>Not Found</title></head><body><h1>Not found</h1><p>Error 404</p></body></html>\n"
	const status = 404
	headers["Content-Type"] = "text/html"
	log(conn, req, status)
	return new Response(body, {status, headers})
}

async function getRoot(conn, req, headers) {
	const body = "<html><head><title>CorbieMU</title></head><body><h1>CorbieMU</h1><p>(o)&gt;</p></body></html>\n"
	const status = 200
	headers["Content-Type"] = "text/html"
	log(conn, req, status)
	return new Response(body, {status, headers})
}

const packetSuccess = '{ "result": "Packet Received" }\n'
const packetFail = '{ "error": "Bad Request" }\n'

async function postPost(conn, req, headers) {
	var body = ""
	var status = 0
	try {
		const rawpacket = await readStream(req.body)
		const packet = JSON.parse(rawpacket)
		headers["Content-Type"] = "application/json"
		body = packetSuccess
		status = 200
		tree().emit("Packet", packet)
		log(conn, req, status)
	} catch(e) {
		body = packetFail
		status = 400
		log(conn, req, status)
	}
	return new Response(body, {status, headers})
}

async function websocket(conn, req, headers) {
	try {
		log(conn, req, "Websocket")
		var websocket = Deno.upgradeWebSocket(req)

		websocket.socket.onopen = function() {
			log(conn, req, "Websocket opened")
			websocket.socket.send('{ "status": "online" }')
		}
		websocket.socket.onmessage = function(msg) {
			log(conn, req, "Websocket packet")
			try {
				const rawpacket = msg.data
				const packet = JSON.parse(rawpacket)
				websocket.socket.send(packetSuccess)
				tree().emit("Packet", packet)
			} catch(e) {
				websocket.socket.send(packetFail)
			}
		}
		websocket.socket.onerror = function(e) {
			log(conn, req, "Websocket error")
			log(conn, req, e)
		}

		websocket.socket.onclose = function() {
			log(conn, req, "Websocket closed")
		}

		return websocket.response
	} catch(e) {
		log(conn, req, "Websocket error")
		log(conn, req, e)
		return new Response("500 Internal Server Error", {status: 500, headers})
	}
}

export default function parliament(opts = { hostname: "localhost", port: 8080 }) {
	this.headers = {
		"X-Ash": "Is still the bum"
	}

	this.start = async function() {
		if(this.server) {
			throw new Error("Already listening")
			return false
		}

		this.abortController = new AbortController()

		const serveOpts = {
			signal: this.abortController.signal
		}

		this.server = server.listenAndServe(`${opts.hostname}:${opts.port}`, this.handler, serveOpts)
		tree().emit("Log", 'Parliament: Now listening', opts)


	}.bind(this)

	this.handler = async function(req, conn) {
		try {
			var url = new URL(req.url)

			if(url.pathname == '/' && req.method == "GET") {
				return await getRoot(conn, req, this.headers)
			}

			if(url.pathname == '/post/' && req.method == "POST") {
				return await postPost(conn, req, this.headers)
			}

			if(url.pathname == '/socket/' && req.headers.get("upgrade") == "websocket") {
				return await websocket(conn, req, this.headers)
			}

			return await request404(conn, req, this.headers)
		} catch(e) {
			log(conn, req, 500)
			return new Response("500 Internal Server Error", {status: 500, headers})
		}
	}.bind(this)

	this.close = async function() {
		if(!this.server) {
			return
		}
		this.abortController.abort()
		await this.server
	}.bind(this)
}
