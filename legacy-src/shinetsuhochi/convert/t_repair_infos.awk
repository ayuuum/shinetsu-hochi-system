#! /bin/awk -f 
BEGIN {
	fields = 10;
	debug=0;	
	FS=",";
	RS="\n";
	now="\""strftime("%Y-%m-%d %T",systime())"\"";
	LINES=0;
	printf("INSERT INTO t_repair_infos VALUES\n") > "t_repair_infos.sql";
}
{ 
	if(NF==fields && verifynf()==1)	
	{
		split($0,array);
		writesql(array);
	}else
	{
		readandsplit($0,array)
		writesql(array);
	}
}
function writesql(arr)
{
	for(i=1;i<=length(arr);i++)
	{
		if(arr[i]=="\r"||arr[i]=="\n"||length(arr[i])==0)
		{
			arr[i]="\"\"";
		}
		
		end=substr(arr[i],length(arr[i]));
		if(end=="\r")
		{
			arr[i]=substr(arr[i],1,length(arr[i])-1);
		}
		if(arr[i] ~/[0-9]+\/[0-9]+\/[0-9]+ [0-9]+[:][0-9]+[:][0-9]+/) 
		{
			gsub(/\//,"-",arr[i]);
			arr[i] = "\""arr[i]"\"";
		}
		
		gsub(/\\/,"\\\\",arr[i]);
		
		if(debug==1)
		{
			print "arr["i"] = "arr[i] " len = "length(arr[i]);
		}
	}
	if(LINES>0)printf(",") > "t_repair_infos.sql";
	##printf(0,01,02,03,04,05,06,07,08,09, 10 ,11,12,0,0)
	printf("(0,%d,%d, 1,%d, 2,%d,%d,%d,%s,null,%d,%s,%s,%s)\n", array[1], array[2], array[3], array[4], array[5], array[6], array[7], array[8], array[9],now,now) > "t_repair_infos.sql";
	LINES++;
}
function readandsplit(string,array)
{
	i=1;
	search = ","
	while(i<fields)
	{
		if(search==","){
			c = index(string,search);
		}else
		{
			c = indexquotation(string);
		}
		if(c>0)
		{
			sstr = substr(string,1,c-1);
			estr = substr(string,c+1);

			if((sstr ~/^"/)&&(sstr ~/[^"]$/))
			{
				search = "\""
				d=0;
				do{
					d =	 index(estr,"\"");
					if(d==0)
					{
						getline nextline; 
						estr = estr""nextline;
						continue;
					}else{
						if(checkbackslash(string,d)==1)
						{	
							mid = substr(estr,1,d);
							sstr=sstr""mid;
							estr = substr(estr,d+1);
							d=0;
							continue;
						}else
						{
							mid = substr(estr,1,d);
							sstr=sstr""mid;
							string = substr(estr,d+1);
							array[i]=sstr;
							i++;
							search = ",";
							break;
						}
					}
				}
				while(d==0);
			}else
			{
				array[i] = sstr;
				string = estr;
				i++;
				continue;
			}
		}else
		{
			getline nextline; 
			string = string""nextline;
			if((string ~/^"/)&&(string ~/[^"]$/))
			{
				search = "\"";
			}
			continue;
		}
	}
	
}
function indexquotation(str)
{
	searchstr = substr(str,2);
	return index(searchstr,"\"");
}
function checkbackslash(string,pos)
{
	if(pos==1||pos>length(string))return 0;
	char = substr(string,pos-1,1);
	if(char!="\\")return 0;
	return 1;
}
function verifynf()
{
	if(verifynum($1)==0)return 0;
	if(verifynum($2)==0)return 0;
	if(verifynum($3)==0)return 0;
	if(verifynum($4)==0)return 0;
	if(verifynum($5)==0)return 0;
	if(verifynum($6)==0)return 0;
	if(verifydata($7)==0)return 0;
	if(verifynum($8)==0)return 0;
	if(verifystr($9)==0)return 0;
	if(verifystr($10)==0)return 0;
		
	return 1;
}
function verifystr(str)
{
	if(str ~/^"("$|"\r$)/)return 1;
	return 0;
}
function verifynum(num)
{
	if(num ~/[0-9]+/)return 1;
	if(num ~/\\[0-9]+/)return 1;
	return 0;
}
function verifydata(data)
{
	if(data ~/[0-9]+(\/|-)[0-9]+(\/|-)[0-9]+ [0-9]+[:][0-9]+[:][0-9]+/)return 1;
	return 0;
}
END {
	printf(";") > "t_repair_infos.sql";
	print "["LINES"] records converted!";
	close("t_repair_infos.sql");
}
