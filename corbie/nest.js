import * as engine262 from "./../vendor/engine262/engine262.mjs"

function egg(id, type, attribs) {
	this.id = id
	this.data = {}
	Object.assign(this.data, attribs)

	this.serialize = function() {
		return JSON.stringify(this.data)
	}.bind(this)
}

export default function nest(tree, db) {
	this.tree = tree
	this.db = db

	this.find = function(query) {
		return this.db.find(query)
	}.bind(this)

	this.create = function(owner) {
		const base = {}
		base.created = Date.now()
		if(owner) {
			base.owner = owner
		}
		return this.db.create(base)
	}.bind(this)

	this.get = function(actor, id, attr) {
		return this.db.get(id, attr)
	}.bind(this)

	this.set = function(actor, id, attr, value) {
		return this.db.set(id, attr, value)
	}.bind(this)

	this.exec = function(actor, id, attr, ...args) {
		/* ??? */
	}.bind(this)

	this.execAs = function(actor, script, ...args) {
		return new Promise(function(resolve, reject) {
			const workerPath = new URL('./softcodeworker.js', import.meta.url).href
			const workerOpts = { type: "module" }
			var worker = new Worker(workerPath, workerOpts)

			worker.addEventListener('message', function(msg) {
				if(msg.data.type == "open") {
					worker.postMessage({ type: "init", script: script })
				}

				if(msg.data.type == "done") {
					worker.terminate()
					resolve(msg.data.value)
				}
				if(msg.data.type == "error") {
					worker.terminate()
					reject(msg.data.error)
				}
			})
		})
	}.bind(this)
}
