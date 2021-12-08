import * as engine262 from "./../vendor/engine262/engine262.mjs"
import { crypto } from "https://deno.land/std@0.115.1/crypto/mod.ts"

function egg(id, type, attribs) {
	this.id = id
	this.data = {}
	Object.assign(this.data, attribs)

	this.serialize = function() {
		return JSON.stringify(this.data)
	}.bind(this)
}

function bytesToHex(buf) {
	const mog = x => x.toString(16).padStart(2, '0')
	return new Array(...new Uint8Array(buf)).map(mog).join('')
}

function hexToBytes(hex) {
	const mog = x => Number.parseInt(x, 16)
	return new Uint8Array(hex.match(/(..)/g).map(mog))
}

const NEXUS = 0
const CAPTAIN = 1
const BRIDGE = 2

export default function nest(tree, db) {
	/* Functions not bound to this */
	this.normalizeAttribute = function(attr) {
		return attr.toLowerCase()
	}

	this.checkPassword = async function(password, stored) {
		const [algorithm, salt, hash] = stored.split('$')
		const attempt = await crypto.subtle.digest(algorithm, new TextEncoder().encode(salt + password))
		return bytesToHex(attempt) == hash
	}

	this.createPassword = async function(password, salt = undefined) {
		const algorithm = 'SHA-512'
		if(!salt) {
			salt = bytesToHex(crypto.getRandomValues(new Uint8Array(8)))
		}
		const bytes = await crypto.subtle.digest(algorithm, new TextEncoder().encode(salt + password))
		const hash = bytesToHex(bytes)
		return `${algorithm}$${salt}$${hash}`
	}

	this.tree = tree
	this.db = db

	this.find = function(query) {
		return this.db.find(query)
	}.bind(this)

	this.create = function(base, owner, id = undefined) {
		base.Created = Date.now()
		if(owner) {
			base.Owner = owner
		}
		return this.db.create(base, id)
	}.bind(this)

	this.get = function(actor, id, attr) {
		attr = this.normalizeAttribute(attr)
		return this.db.get(id, attr)
	}.bind(this)

	this.set = function(actor, id, attr, value) {
		attr = this.normalizeAttribute(attr)
		if(-1 != reservedAttributes.indexOf(attr)) {
			throw new Error(`Cannot set reserved attribute ${attr}`)
		}
		return this.db.set(id, attr, value)
	}.bind(this)

	this.exec = function(actor, id, attr, ...args) {
		attr = this.normalizeAttribute(attr)
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

	this.init = function() {
		/*  Set up basics */

		if(!this.db.exists(CAPTAIN)) {
			const captain = {
				Indestructible: true,
				Password: this.createPassword('Luminiferous', 'AETHER')
				desc: "Though related to a peer, I can hand, reef, and steer, And ship a selvagee; I am never known to quail at the fury of a gale, and I’m never, never sick at sea!",
				name: "Captain",
			}
			this.db.create(captain, CAPTAIN, CAPTAIN)
		}

		if(!this.db.exists(NEXUS)) {
			const nexus = {
				Indestructible: true,
				desc: "In the beginning, the Earth was without form, and void.",
				name: "Nexus",
			}
			this.db.create(nexus, CAPTAIN, NEXUS)
		}

		if(!this.db.exists(BRIDGE)) {
			const nexus = {
				Indestructible: true,
				desc: "You have the conn.",
				name: "Nexus",
			}
			this.db.create(nexus, CAPTAIN, BRIDGE)
		}
	}.bind(this)
}
