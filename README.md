# Getting Oracle Cloud Infrastructure Security Lists 
Using this script in an environment with a configured oci-cli
it is able to get the Security Lists of a compartment and associate
these with the proper VCN cq. subnet.

Get all security lists and write the JSON to a file in the output directory.
```
   node getSLs 
```

Get all security lists that references a given port and write the JSON to a file in the output directory.
```
   node getSLs port=8000
```

Get all security lists that references a given ip-adress and write the JSON to a file in the output directory.
```
   node getSLs ip=x.x.x.x
```