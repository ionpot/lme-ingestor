set -e

host="www.metalsmarket.net"

openssl s_client -connect "$host:443" </dev/null >server.cert

openssl x509 -in server.cert -noout -text | grep -i issuer
