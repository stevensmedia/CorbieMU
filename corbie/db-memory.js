import * as uuid from "https://deno.land/std@0.116.0/uuid/mod.ts"

export default function dbMemory(opts) {
	this.db = {}

	this.create = function(attrs) {
		const id = uuid.v4.generate()
		db[id] = attrs
		return id
	}.bind(this)

	this.get = function(id, attr) {
		return db[id][attr]
	}.bind(this)

	this.set = function(id, attr, value) {
		db[id][attr] = value
		return value
	}.bind(this)

	this.exists = function(id) {
		return typeof db[id] == 'object'
	}.bind(this)
}
