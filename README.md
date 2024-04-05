# How to install

First install the dependencies, listed in the package.json

```
    npm install
```

Then you need oci-cli installed in your environment
```
https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm
```

# Getting Oracle Cloud Infrastructure Security Lists and/or Routing information
Using this script in an environment with a configured and priviledged oci-cli
it is able to get the Security Lists / Routing Tables of a compartment and associate
these with the proper VCN cq. subnet.
### Example 1
Get all everything around a given IP adress and write the JSON to files in the output directory.
This is a bash script; a windows bat version is also included

```
   sh checkIP.sh x.x.x.x
```
### Example 2
Get all security lists and write the JSON to a file in the output directory.
```
   node getSLs 
```
### Example 3
Get all routing tables and write the JSON to a file in the output directory.
```
   node getRouting
```
### Example 4
Get all security lists that references a given port and write the JSON to a file in the output directory.
```
   node getSLs port=8000
```
### Example 5
Get all security lists that references a given ip-adress and write the JSON to a file in the output directory.
```
   node getSLs ip=x.x.x.x
```
### Example 6
Get all routing tables that references a given ip-adress and write the JSON to a file in the output directory.
```
   node getrouting ip=x.x.x.x
```
### Example 7
Get all security lists that references a description with a certain text and write the JSON to a file in the output directory.
```
   node getSLs description=xxx
```
### Example 8
Get all routing tables that references a description with a certain text and write the JSON to a file in the output directory.
```
   node getRouting description=xxx
```
### Example 9
Get all security lists that references a vcnName with a certain text and write the JSON to a file in the output directory.
```
   node getSLs vcnName=xxx
```   
