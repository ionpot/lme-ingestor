if [[ ! -d node_modules ]]; then
	npm install
fi

if [[ ! -d nodejs ]]; then
	mkdir nodejs
fi

if [[ ! -d nodejs/node_modules ]]; then
	ln -s `realpath node_modules` nodejs/node_modules
fi

echo zipping...
zip -qFSr layer.zip nodejs

if [[ $? -eq 0 ]]; then
	rm -rf nodejs
	echo uploading...
	aws lambda publish-layer-version\
		--region "eu-west-2"\
		--layer-name "lme-ingestor-layer"\
		--zip-file "fileb://layer.zip"
	test $? -eq 0 && rm layer.zip
fi
