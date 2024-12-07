set -e

url="$1" # http://*.com/*.crt

test -n "$url"

curl --output issuer.crt "$url"

openssl x509 -inform DER -in issuer.crt -out issuer.pem -text

rm issuer.crt
