#!/bin/sh
# Kijkt alles na van een gegeven IP-adres:
# - Waar komt hij voor in de Security lists
# - Waar komt hij voor in de routing tables
#
# Auteur       : H.E. van Meerendonk
# Creatiedatum : 22.12.2023
# Revisie      :
# 22.12.2023 EDME1 Onderdrukken van experimental warnings. Komt door
#                  het gebruik van ES6-like imports

if [ -z "$1" ]
then
    echo "Error: No argument provided. Please provide an IP address."
    exit 1
fi

node --no-warnings getSLs ip=$1
node --no-warnings getRouting ip=$1
