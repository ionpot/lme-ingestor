zip -jFSr code.zip src

if [[ $? -eq 0 ]]; then
	echo uploading...
	aws lambda update-function-code\
		--region "eu-west-2"\
		--function-name "lme-ingestor"\
		--zip-file "fileb://code.zip"
	test $? -eq 0 && rm code.zip
fi
