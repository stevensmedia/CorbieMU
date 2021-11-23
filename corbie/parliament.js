import { default as tree } from "./tree.js"

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
	if(!req) {
		tree().emit("Log", 'Parliament:', `${conn.remoteAddr.transport}/${conn.remoteAddr.hostname}:${conn.remoteAddr.port}`, ":", status)
	} else {
		tree().emit("Log", 'Parliament:', `${conn.remoteAddr.transport}/${conn.remoteAddr.hostname}:${conn.remoteAddr.port}`, ":", status, req.request.method, ":", req.request.url)
	}
}

async function request404(conn, req, headers) {
	const body = "<html><head><title>Not Found</title></head><body><h1>Not found</h1><p>Error 404</p></body></html>\n"
	const status = 404
	headers["Content-Type"] = "text/html"
	log(conn, req, status)
	const resp = new Response(body, {status, headers})
	await req.respondWith(resp)
}

async function getRoot(conn, req, headers) {
	const body = "<html><head><title>CorbieMU</title></head><body><h1>CorbieMU</h1><p>(o)&gt;</p></body></html>\n"
	const status = 200
	headers["Content-Type"] = "text/html"
	log(conn, req, status)
	const resp = new Response(body, {status, headers})
	await req.respondWith(resp)
}

const packetSuccess = '{ "result": "Packet Received" }\n'
const packetFail = '{ "error": "Bad Request" }\n'

async function postPost(conn, req, headers) {
	var body = ""
	var status = 0
	try {
		const rawpacket = await readStream(req.request.body)
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
	const resp = new Response(body, {status, headers})
	await req.respondWith(resp)
}

async function websocket(conn, req, headers) {
	var websocket = Deno.upgradeWebSocket(req.request)
	websocket.socket.onopen = function() {
		websocket.socket.send('{ "status": "online" }')
		tree().emit("Log", 'Parliament:', `${conn.remoteAddr.transport}/${conn.remoteAddr.hostname}:${conn.remoteAddr.port}`, ": Websocket opened!")
	}
	websocket.socket.onmessage = function(msg) {
		tree().emit("Packet?")
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
		tree().emit("Log", 'Parliament:', `${conn.remoteAddr.transport}/${conn.remoteAddr.hostname}:${conn.remoteAddr.port}`, ": Websocket error: ", e.message)
	}

	websocket.socket.onclose = function() {
		tree().emit("Log", 'Parliament:', `${conn.remoteAddr.transport}/${conn.remoteAddr.hostname}:${conn.remoteAddr.port}`, ": Websocket closed!")
	}

	req.respondWith(websocket.response)
}

async function handleConnection(conn) {
	var headers = {
		"X-Ash": "Is still the bum"
	}
	try {
		for await (const req of Deno.serveHttp(conn)) {
			var url = new URL(req.request.url)
			if(url.pathname == '/' &&
			   req.request.method == "GET") {
				await getRoot(conn, req, headers)
				continue
			}
			if(url.pathname == '/post/' &&
			   req.request.method == "POST") {
				await postPost(conn, req, headers)
				continue
			}
			if(url.pathname == '/socket/' &&
			   req.request.headers.get("upgrade") == "websocket") {
				await websocket(conn, req, headers)
				continue
			}
			await request404(conn, req, headers)
		}
	} catch(e) {
		log(conn, false, 500)
		tree().emit("Log", 'Parliament: Internal Server Error: ', e)
	}
}

export default async function(opts = { hostname: "localhost", port: 8080 }) {
	const server = Deno.listen(opts)
	tree().emit("Log", 'Parliament: Now listening', opts)

	while(true) {
		handleConnection(await server.accept())
	}
}
