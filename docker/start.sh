#!/bin/bash

# If working from a bare source checkout, rebuild some things so that the site loads properly
if [ ! -d /dogewallet/build ]; then
    cd /dogewallet/src; bower --allow-root --config.interactive=false update
    cd /dogewallet; npm update
    npm run prepublish
    npm run build
    #grunt build --dontcheckdeps
fi
if [ ! -f /dogewallet/dogewallet.conf.json ]; then
    cp -a /dogewallet/dogewallet.conf.json.example /dogewallet/dogewallet.conf.json
fi
if [ ! -f /ssl_config/dogewallet.pem ]; then
    cp -a /etc/ssl/certs/ssl-cert-snakeoil.pem /ssl_config/dogewallet.pem
fi
if [ ! -f /ssl_config/dogewallet.key ]; then
    cp -a /etc/ssl/private/ssl-cert-snakeoil.key /ssl_config/dogewallet.key
fi

# Specify defaults (defaults are overridden if defined in the environment)
export REDIS_HOST=${REDIS_HOST:="redis"}
export REDIS_PORT=${REDIS_PORT:=6379}
export REDIS_DB=${REDIS_DB:=0}
export DOGEBLOCK_HOST_MAINNET=${DOGEBLOCK_HOST_MAINNET:="dogeblock"}
export DOGEBLOCK_HOST_TESTNET=${DOGEBLOCK_HOST_TESTNET:="dogeblock-testnet"}
export DOGEBLOCK_PORT_MAINNET=${DOGEBLOCK_PORT_MAINNET:=4100}
export DOGEBLOCK_PORT_TESTNET=${DOGEBLOCK_PORT_TESTNET:=14100}
export DOGEBLOCK_PORT_MAINNET_FEED=${DOGEBLOCK_PORT_MAINNET_FEED:=4101}
export DOGEBLOCK_PORT_TESTNET_FEED=${DOGEBLOCK_PORT_TESTNET_FEED:=14101}
export DOGEBLOCK_PORT_MAINNET_CHAT=${DOGEBLOCK_PORT_MAINNET_CHAT:=4102}
export DOGEBLOCK_PORT_TESTNET_CHAT=${DOGEBLOCK_PORT_TESTNET_CHAT:=14102}

VARS='$REDIS_HOST:$REDIS_PORT:$REDIS_DB:$DOGEBLOCK_HOST_MAINNET:$DOGEBLOCK_HOST_TESTNET:$DOGEBLOCK_PORT_MAINNET:$DOGEBLOCK_PORT_TESTNET:$DOGEBLOCK_PORT_MAINNET_FEED:$DOGEBLOCK_PORT_TESTNET_FEED:$DOGEBLOCK_PORT_MAINNET_CHAT:$DOGEBLOCK_PORT_TESTNET_CHAT'
envsubst "$VARS" < /dogewallet/docker/nginx/dogewallet.conf.template > /etc/nginx/sites-enabled/dogewallet.conf

# Launch utilizing the SIGTERM/SIGINT propagation pattern from
# http://veithen.github.io/2014/11/16/sigterm-propagation.html
trap 'kill -TERM $PID' TERM INT
nginx -g 'daemon off;' &
# ^ maybe simplify to just be "nginx" in the future
PID=$!
wait $PID
trap - TERM INT
wait $PID
EXIT_STATUS=$?
