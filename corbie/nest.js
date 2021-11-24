export default function nest(db) {
	this.db = db

	this.get = function(id) {
		console.log(this)
	}.bind(this)
}
