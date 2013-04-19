
build: components app.js
	@component build 

components: component.json
	@component install

clean:
	rm -fr build components lib/template.js

.PHONY: clean
