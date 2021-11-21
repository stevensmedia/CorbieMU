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

export default async function(opts = { hostname: "localhost", port: 8080 }) {
	const server = Deno.listen(opts)
	tree().emit("Log", 'Parliament: Now listening', opts)
	for await (const conn of server) {
		var headers = {
			"X-Ash": "Is still the bum"
		}
		var status = 200
		var body = ""
		try {
			for await (const req of Deno.serveHttp(conn)) {
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
				const resp = new Response('{ "error": "Bad Request" }\n', {
					status: status,
					headers: {
						"X-Ash": "Is still the bum"
					}
				})
				await req.respondWith(resp)

			}
		} catch(e) {
			tree().emit("Log", 'Parliament: ', conn.remoteAddr, ": 500 Error: ",  e)
		}
	}
}
