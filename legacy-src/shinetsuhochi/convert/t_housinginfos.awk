#! /bin/awk -f 
BEGIN {
	fields = 9;
	debug=0;	
	FS=",";
	RS="\n";
	now="\""strftime("%Y-%m-%d %T",systime())"\"";
	LINES=0;
	printf("INSERT INTO t_housinginfos VALUES\n") > "t_housinginfos.sql";
}
{ 
	if(NF<fields)
	{
		len=0;
		str=$0;
		do{
			getline nextline; 
			str=str""nextline;
			len = split(str,array);
		}		
		while(len<fields);
		if(len==fields)
		{
			writesql(array);
		}else
		{
			print "error around " str;
			next;
		}
	}
	else if(NF>fields)
	{
		reparestring(array);
		writesql(array);
	}
	else{
		#print "zero = "$0;
		#print "six = "$6;
		split($0,array);
		writesql(array);
	}
}
function reparestring(arr)
{
	str =""
	f=1;
	for(i=1;i<=NF;i++)
	{
		#print "len = "length($i)" "$i"\n";
		# "xxxx"\rの場合を処理する		
		if(($i ~/^"/)&&($i ~/[\r]$/)) 
		{
			arr[f]=substr($i,1,length($i)-1);
			f++;
			#printf("repare %s\n",arr[f]);			
			continue;
		}
		if(($i ~/^"/)&&($i ~/"$/))
		{
			arr[f]=$i;
			f++;
			#printf("$i = %s continue\n",$i);			
			continue;
		}		
		if(($i ~/^"/)&&($i ~/[^"]$/)) 
		{
			#print $i"matched";
			str=$i",";
			#printf("start = %s\n",$i);
			#printf("str = %s\n",str);
		}else if(($i ~/^[^"]/)&&($i ~/"$/))
		{
			str=str""$i;
			arr[f]=str;
			#printf("end = %s\n",$i);
			#printf("str = %s\n",str);
			str="";
			f++;
			
		}else if(length(str)>0)
		{
			str=str""$i;
			#printf("string = %s\n",$i);
			#printf("str = %s\n",str);
			continue;
		}
		else
		{
			arr[f]=$i;
			f++;
			continue;
		}
		
	}
	
	return;
}
function writesql(arr)
{
	#for(i=1;i<=length(arr);i++)
	{
		#printf("arr[%d] = %s\n",i,arr[i]);
	}
	#print "arr[6]="arr[6];
	for(i=1;i<=length(arr);i++)
	{
		if(debug==1)
		{
			print "arr["i"] = "arr[i] " len = "length(arr[i]);
		}
		if(arr[i]=="\r"||arr[i]=="\n"||length(arr[i])==0)
		{
			arr[i]="\"\"";
		}
		
		end=substr(arr[i],length(arr[i]));
		if(end=="\r")
		{
			arr[i]=substr(arr[i],1,length(arr[i])-1);
		}

		if(debug==1)
		{
			print "arr["i"] = "arr[i] " len = "length(arr[i]);
		}
	}
	if(LINES>0)printf(",") > "t_housinginfos.sql";
	################################# printf (0,01,02,03,04,05,06,07,08,09,10,11)
	printf("(0,%d,%d,%d,%s,%s,%s,%s,%s,%s,%s,%s)\n", array[1], array[2], array[3], array[4], array[5], array[6], array[7], array[8], array[9],now,now) > "t_housinginfos.sql";
	LINES++;
}
END {
	printf(";") > "t_housinginfos.sql";
	print "["LINES"] records converted!";
	close("t_housinginfos.sql");
}
