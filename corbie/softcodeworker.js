import * as js from "./../vendor/engine262/engine262.mjs"

var proc = self
proc.addEventListener("message", (msg) => {
	var count = 0
	try {
		if(msg.data.type == "init") {
			const agent = new js.Agent({
				onNodeEvaluation(node) {
					++count
					if(count > 100) {
						throw new Error("Terminated")
					}
				}
			})
			js.setSurroundingAgent(agent)

			const realm = new js.ManagedRealm({})

			realm.scope(function() {
				const corbie = js.OrdinaryObjectCreate(realm.Intrinsics['%Object.prototype%'])
				const corbieName = new js.Value('corbie')
				js.CreateDataProperty(realm.GlobalObject, corbieName, corbie)

				const beepName = new js.Value('beep')
				const beep = js.CreateBuiltinFunction((args) => {
					proc.postMessage({ type: "beep" })
					return js.Value.undefined
				}, 0, new js.Value('beep'), [])
				js.CreateDataProperty(corbie, beepName, beep)
			})

			var result = realm.evaluateScript(msg.data.script)
			proc.postMessage({ type: "done", value: result })
			proc.close()
		}
	} catch(e) {
		proc.postMessage({ type: "error", error: e })
		proc.close()
	}
})
