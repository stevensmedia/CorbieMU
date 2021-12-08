import { CouchClient } from "https://denopkg.com/keroxp/deno-couchdb/couch.ts";

export default function dbCouch(opts) {
	this.couch = new CouchClient(opts.url)
	this.db = couch.database(opts.database)

	this.create = function(attrs) {
	}.bind(this)

	this.get = function(id, attr) {
	}.bind(this)

	this.set = function(id, attr, value) {
	}.bind(this)

	this.exists = function(id) {
	}.bind(this)

}
