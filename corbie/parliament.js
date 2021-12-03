import * as server from "https://deno.land/std@0.116.0/http/server.ts";

const decoder = new TextDecoder("utf8")

const packetSuccess = '{ "result": "Packet Received" }\n'
const packetFail = '{ "error": "Bad Request" }\n'

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

export default function parliament(tree, opts = { hostname: "localhost", port: 4201 }) {
	this.tree = tree

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
		this.tree.emit("Log", 'Parliament: Now listening', opts)
	}.bind(this)

	this.handler = async function(req, conn) {
		try {
			var url = new URL(req.url)

			if(url.pathname == '/' && req.method == "GET") {
				return await this.getRoot(conn, req, this.headers)
			}

			if(url.pathname == '/post/' && req.method == "POST") {
				return await this.postPost(conn, req, this.headers)
			}

			if(url.pathname == '/socket/' && req.headers.get("upgrade") == "websocket") {
				return await this.websocket(conn, req, this.headers)
			}

			return await this.request404(conn, req, this.headers)
		} catch(e) {
			this.log(conn, req, 500)
			this.log(conn, req, e)
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

	this.log = function(conn, req, status) {
		this.tree.emit("Log", `Parliament ${conn.remoteAddr.transport}/${conn.remoteAddr.hostname}:${conn.remoteAddr.port} ${status} ${req.method} ${req.url}`)
	}.bind(this)

	this.request404 = async function(conn, req, headers) {
		const body = "<html><head><title>Not Found</title></head><body><h1>Not found</h1><p>Error 404</p></body></html>\n"
		const status = 404
		headers["Content-Type"] = "text/html"
		this.log(conn, req, status)
		return new Response(body, {status, headers})
	}.bind(this)

	this.getRoot = async function(conn, req, headers) {
		const body = "<html><head><title>CorbieMU</title></head><body><h1>CorbieMU</h1><p>(o)&gt;</p></body></html>\n"
		const status = 200
		headers["Content-Type"] = "text/html"
		this.log(conn, req, status)
		return new Response(body, {status, headers})
	}.bind(this)

	this.postPost = async function(conn, req, headers) {
		var body = ""
		var status = 0
		try {
			const rawpacket = await readStream(req.body)
			const packet = JSON.parse(rawpacket)
			headers["Content-Type"] = "application/json"
			body = packetSuccess
			status = 200
			this.tree.emit("Packet", packet)
			this.log(conn, req, status)
		} catch(e) {
			body = packetFail
			status = 400
			this.log(conn, req, status)
		}
		return new Response(body, {status, headers})
	}.bind(this)

	this.websocket = async function(conn, req, headers) {
		try {
			log(conn, req, "Websocket")
			var websocket = Deno.upgradeWebSocket(req)

			websocket.socket.onopen = function() {
				this.log(conn, req, "Websocket opened")
				websocket.socket.send('{ "status": "online" }')
			}
			websocket.socket.onmessage = function(msg) {
				this.log(conn, req, "Websocket packet")
				try {
					const rawpacket = msg.data
					const packet = JSON.parse(rawpacket)
					websocket.socket.send(packetSuccess)
					this.tree.emit("Packet", packet)
				} catch(e) {
					websocket.socket.send(packetFail)
				}
			}
			websocket.socket.onerror = function(e) {
				this.log(conn, req, "Websocket error")
				this.log(conn, req, e)
			}

			websocket.socket.onclose = function() {
				this.log(conn, req, "Websocket closed")
			}

			return websocket.response
		} catch(e) {
			this.log(conn, req, "Websocket error")
			this.log(conn, req, e)
			return new Response("500 Internal Server Error", {status: 500, headers})
		}
	}.bind(this)
}
