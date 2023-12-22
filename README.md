# Getting Oracle Cloud Infrastructure Security Lists and/or Routing information
Using this script in an environment with a configured oci-cli
it is able to get the Security Lists / routing table of a compartment and associate
these with the proper VCN cq. subnet.

Get all everything around a given IP adress and write the JSONs to files in the output directory.
This is a bash script; a windows bat version is easy in my opinion.
```
   sh checkIP.sh x.x.x.x
```

Get all security lists and write the JSON to a file in the output directory.
```
   node getSLs 
```

Get all routing tables and write the JSON to a file in the output directory.
```
   node getRouting
```

Get all security lists that references a given port and write the JSON to a file in the output directory.
```
   node getSLs port=8000
```

Get all security lists that references a given ip-adress and write the JSON to a file in the output directory.
```
   node getSLs ip=x.x.x.x
```

Get all routing tables that references a given ip-adress and write the JSON to a file in the output directory.
```
   node getrouting ip=x.x.x.x
```

Get all security lists that references a description with a certain text and write the JSON to a file in the output directory.
```
   node getSLs description=xxx
```

Get all routing tables that references a description with a certain text and write the JSON to a file in the output directory.
```
   node getRouting description=xxx
```

Get all security lists that references a vcnName with a certain text and write the JSON to a file in the output directory.
```
   node getSLs vcnName=xxx
```   

And all kinds of attributes can be used

