#! /bin/awk -f 
BEGIN {
	fields = 24;
	FS=",";
	RS="\n";
	now="\""strftime("%Y-%m-%d %T",systime())"\"";
	LINES=0;
	printf("INSERT INTO t_check_infos VALUES\n") > "t_check_infos.sql";
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
	else{
		split($0,array);
		writesql(array);
	}
}  
function writesql(arr)
{
	for(i=1;i<=length(arr);i++)
	{
		if(debug==1)
		{
			#print "arr["i"] = "arr[i] " len = "length(arr[i]);
		}
		if(arr[i]=="\r"||arr[i]=="\n"||length(arr[i])==0)
		{
			arr[i]="\"\"";
		}

		#最後の[\r]を抜きます
		end=substr(arr[i],length(arr[i]));
		if(end=="\r")
		{
			arr[i]=substr(arr[i],1,length(arr[i])-1);
		}

		#通貨型の「\」を抜きます
		if(arr[i] ~/^\\[0-9]+/) 
		{
			arr[i] = substr(arr[i],2);
		}
		if(debug==1)print "arr["i"] = "arr[i] " len = "length(arr[i]);
	}
	if(LINES>0)printf(",") > "t_check_infos.sql";
	##printf(0,01,02,03,04,5,06,7,08,09,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38"
	printf("(0,%d,%d,%d,%d,1,%d,2,%d,%d,%d,%d,%d,%d,%d,%d,%d,%d,%d,%d, 0, 0, 0, 0, 0,%d,%d,%d,%d,%d, 0, 0, 0, 0, 0,%d, 0,%s,%s)\n", array[1], array[2], array[3], array[4], array[6], array[7], array[8], array[9], array[10], array[11], array[12], array[13], array[14], array[15], array[16], array[17], array[18], array[19], array[20], array[21], array[22], array[23], array[24],now,now) > "t_check_infos.sql";
	LINES++;
}
END {
	printf(";") > "t_check_infos.sql";
	print "["LINES"] records converted!";
	close("t_check_infos.sql");
}
