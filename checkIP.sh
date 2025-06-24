#!/bin/sh
# Check everything about an IP address
# - Where does it apear in a Security lists
# - Where does it apear in a Routing table
#
# Auteur       : H.E. van Meerendonk
# Creatiedatum : 22.12.2023
# Revisie      :
# 22.12.2023 EDME1 Suppress experimental warnings. This is because of the ES6 syntax in the node.js code.

if [ -z "$1" ]
then
    echo "Error: No argument provided. Please provide an IP address."
    exit 1
fi

node --no-warnings getSLs ip=$1
node --no-warnings getRouting ip=$1
