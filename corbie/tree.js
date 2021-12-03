import * as uuid from "https://deno.land/std@0.116.0/uuid/mod.ts"

export default function tree() {
	this.listeners = []

	this.emit = function(ev, ...args) {
		this.listeners
			.filter((listener) => listener.ev == ev)
			.forEach((listener) => listener.call(...args))
	}.bind(this)

	this.on = function(ev, call) {
		var listener = {
			ev: ev,
			call: call,
			id: uuid.v4.generate()
		}
		this.listeners.push(listener)
		return listener.id
	}.bind(this)

	this.remove = function(id) {
		const index = this.listeners.findIndex((l) => l.id == id)
		if(index > -1) {
			delete this.listeners[index]
		}
	}
}
