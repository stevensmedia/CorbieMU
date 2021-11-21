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

async function send404(conn, req, headers) {
	const body = "<html><head><title>Not Found</title></head><body><h1>Not found</h1><p>Error 404</p></body></html>\n"
	const status = 404
	headers["Content-Type"] = "text/html"
	const resp = new Response(body, {status, headers})
	await req.respondWith(resp)
}

async function root(conn, req, headers) {
	const body = "<html><head><title>CorbieMU</title></head><body><h1>CorbieMU</h1><p>(o)&gt;</p></body></html>\n"
	const status = 200
	headers["Content-Type"] = "text/html"
	const resp = new Response(body, {status, headers})
	await req.respondWith(resp)
}

async function postPacket(conn, req, headers) {
	try {
		const rawpacket = await readStream(req.request.body)
		const packet = JSON.parse(rawpacket)
		body = '{ "result": "Packet Received" }\n'
		status = 200
		tree().emit("Packet", packet)
		tree().emit("Log", 'Parliament: ', conn.remoteAddr, ": Packet received")
	} catch(e) {
		body = '{ "error": "Bad Request" }\n'
		status = 400
		tree().emit("Log", 'Parliament: ', conn.remoteAddr, ": 400 Error: ",  e)
	}
	const resp = new Response(body, {status, headers})
	await req.respondWith(resp)
}

export default async function(opts = { hostname: "localhost", port: 8080 }) {
	const server = Deno.listen(opts)
	tree().emit("Log", 'Parliament: Now listening', opts)
	for await (const conn of server) {
		var headers = {
			"X-Ash": "Is still the bum"
		}
		try {
			for await (const req of Deno.serveHttp(conn)) {
				var url = new URL(req.request.url)
				if(url.pathname == '/' &&
				   req.request.method == "GET") {
					await root(conn, req, headers)
					continue
				}
				if(url.pathname == '/post/' &&
				   req.request.method == "POST") {
					await postPacket(conn, req, headers)
					continue
				}
				if(url.pathname == '/socket/' &&
				   req.request.headers.get("upgrade") == "websocket") {
					await websocket(conn, req, headers)
					continue
				}
				await send404(conn, req, headers)
			}
		} catch(e) {
			tree().emit("Log", 'Parliament: ', conn.remoteAddr, ": 500 Error: ",  e)
		}
	}
}
