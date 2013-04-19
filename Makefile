
build: components app.js
	@component build --dev

components: component.json
	@component install --dev

clean:
	rm -fr build components lib/template.js

.PHONY: clean
