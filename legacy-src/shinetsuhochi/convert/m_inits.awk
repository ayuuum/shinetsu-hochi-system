#! /bin/awk 
BEGIN {
	now="\""strftime("%Y-%m-%d %T",systime())"\"";
}
{ 
	#year=strftime("%Y",systime());
	year=2014;#2015年でも2014に書き込みます
	last=(year+0)-1;
	nex=(year+0)+1;
	thisym=year"05";
	thisyear=year"-5-1";
	nextyear=nex"-4-30";
	#m_inits
	############################printf(0,01     ,02     ,03    ,04             ,05          ,06      ,07      ,08        ,09        ,10           ,11        ,12           ,13             ,14        ,15           ,16　　　　　,17       ,18,19,20,21,22,23,24,25,26)
	printf("INSERT INTO m_inits VALUES(0,\"ITV\",\"電話\",\"音響\",\"連結送水管耐圧\",\"地下タンク\",\"その他\",\"未着手\",\"点検済み\",\"提出済み\",\"社内確認済み\",\"請求済み\",\"見積もり依頼\",\"見積もり提出中\",\"補修済み\",\"社内確認済み\",\"請求済み\",\"対応不要\", 5,%s,%s,%s,%s,\"%s\",\"%s\",null,%s,%s);\n",last,year,nex,thisym,thisyear,nextyear,now,now) > "m_inits.sql";
	
	##	m_kinds
	printf("DELETE FROM m_kinds;\n") > "m_inits.sql";
	########################### printf(00,1,02,03  ,04,05)			
	printf("INSERT INTO m_kinds VALUES( 1,0, 1,\"社内\",%s,%s);\n",now,now) > "m_inits.sql";
	printf("INSERT INTO m_kinds VALUES( 2,0, 2,\"外注\",%s,%s);\n",now,now) > "m_inits.sql";
	printf("INSERT INTO m_kinds VALUES( 3,0, 3,\"個人\",%s,%s);\n",now,now) > "m_inits.sql";
	printf("INSERT INTO m_kinds VALUES( 4,0, 4,\"会社\",%s,%s);\n",now,now) > "m_inits.sql";
	printf("INSERT INTO m_kinds VALUES( 5,1, 1,\"消防設備\",%s,%s);\n",now,now) > "m_inits.sql";
	printf("INSERT INTO m_kinds VALUES( 6,1, 2,\"防火対象物\",%s,%s);\n",now,now) > "m_inits.sql";
	printf("INSERT INTO m_kinds VALUES( 7,1, 3,\"その他\",%s,%s);\n",now,now) > "m_inits.sql";
	printf("INSERT INTO m_kinds VALUES( 8,2,11,\"消防設備(総合)\",%s,%s);\n",now,now) > "m_inits.sql";
	printf("INSERT INTO m_kinds VALUES( 9,2,12,\"消防設備(機器)\",%s,%s);\n",now,now) > "m_inits.sql";
	printf("INSERT INTO m_kinds VALUES(10,2,21,\"防火対象物\",%s,%s);\n",now,now) > "m_inits.sql";
	printf("INSERT INTO m_kinds VALUES(11,2,31,\"ITV\",%s,%s);\n",now,now) > "m_inits.sql";
	printf("INSERT INTO m_kinds VALUES(12,2,32,\"電話\",%s,%s);\n",now,now) > "m_inits.sql";
	printf("INSERT INTO m_kinds VALUES(13,2,33,\"音響\",%s,%s);\n",now,now) > "m_inits.sql";
	printf("INSERT INTO m_kinds VALUES(14,2,34,\"連結送水管耐圧\",%s,%s);\n",now,now) > "m_inits.sql";
	printf("INSERT INTO m_kinds VALUES(15,2,35,\"地下タンク\",%s,%s);\n",now,now) > "m_inits.sql";
	printf("INSERT INTO m_kinds VALUES(16,2,36,\"その他\",%s,%s);\n",now,now) > "m_inits.sql";
	printf("INSERT INTO m_kinds VALUES(17,3, 1,\"毎年\",%s,%s);\n",now,now) > "m_inits.sql";
	printf("INSERT INTO m_kinds VALUES(18,3, 2,\"2年に1回\",%s,%s);\n",now,now) > "m_inits.sql";
	printf("INSERT INTO m_kinds VALUES(19,3, 3,\"3年に1回\",%s,%s);\n",now,now) > "m_inits.sql";
	printf("INSERT INTO m_kinds VALUES(20,3, 4,\"スポット\",%s,%s);\n",now,now) > "m_inits.sql";
	printf("INSERT INTO m_kinds VALUES(21,4, 0,\"一括\",%s,%s);\n",now,now) > "m_inits.sql";
	printf("INSERT INTO m_kinds VALUES(22,4, 1,\"分割\",%s,%s);\n",now,now) > "m_inits.sql";
	printf("INSERT INTO m_kinds VALUES(23,4, 2,\"随時\",%s,%s);\n",now,now) > "m_inits.sql";
	
	##	m_pwds
	printf("DELETE FROM m_pwds;\n") > "m_inits.sql";
	########################### printf(00,1   ,02  ,03  ,4,05,06)		
	printf("INSERT INTO m_pwds  VALUES( 1,0721,1213,null,0,%s,%s);\n",now,now) > "m_inits.sql";
	printf("INSERT INTO m_pwds  VALUES( 2,0266,6000,null,2,%s,%s);\n",now,now) > "m_inits.sql";
	##	m_mentes
	printf("DELETE FROM m_mentes;\n") > "m_inits.sql";
	############################ printf(00,1,2,03  ,04,05)		
	printf("INSERT INTO m_mentes VALUES( 1,0,1,null,%s,%s);\n",now,now) > "m_inits.sql";

	##	m_sysstatuses
	printf("DELETE FROM m_sysstatuses;\n") > "m_inits.sql";
	################################# printf(00,1,02,03)		
	printf("INSERT INTO m_sysstatuses VALUES( 1,0,%s,%s);\n",now,now) > "m_inits.sql";
	
	#printf("INSERT INTO m_pwds (uid, upass, tenkentantoshaCode, urole,created_at,updated_at) SELECT tenkentantoshaCode+1000, 2311, tenkentantoshaCode, 1 ,now(),now() FROM m_checkpeople WHERE tenkentantoshashubetu = 1;\n") > "m_inits.sql";
	printf("INSERT INTO m_pwds (uid, upass, tenkentantoshaCode, urole,created_at,updated_at) VALUES(1001, 2311, 1,1,now(),now());\n") > "m_inits.sql";
	printf("INSERT INTO m_pwds (uid, upass, tenkentantoshaCode, urole,created_at,updated_at) VALUES(1002, 2311, 4,1,now(),now());\n") > "m_inits.sql";
	printf("INSERT INTO m_pwds (uid, upass, tenkentantoshaCode, urole,created_at,updated_at) VALUES(1003, 2311, 5,1,now(),now());\n") > "m_inits.sql";
	printf("INSERT INTO m_pwds (uid, upass, tenkentantoshaCode, urole,created_at,updated_at) VALUES(1004, 2311, 6,1,now(),now());\n") > "m_inits.sql";
	printf("INSERT INTO m_pwds (uid, upass, tenkentantoshaCode, urole,created_at,updated_at) VALUES(1005, 2311, 7,1,now(),now());\n") > "m_inits.sql";
	printf("INSERT INTO m_pwds (uid, upass, tenkentantoshaCode, urole,created_at,updated_at) VALUES(1006, 2311, 8,1,now(),now());\n") > "m_inits.sql";
	printf("INSERT INTO m_pwds (uid, upass, tenkentantoshaCode, urole,created_at,updated_at) VALUES(1007, 2311, 17,1,now(),now());\n") > "m_inits.sql";
	printf("INSERT INTO m_pwds (uid, upass, tenkentantoshaCode, urole,created_at,updated_at) VALUES(1008, 2311, 36,1,now(),now());\n") > "m_inits.sql";
	printf("INSERT INTO m_pwds (uid, upass, tenkentantoshaCode, urole,created_at,updated_at) VALUES(1009, 2311, 37,1,now(),now());\n") > "m_inits.sql";
	printf("INSERT INTO m_pwds (uid, upass, tenkentantoshaCode, urole,created_at,updated_at) VALUES(1010, 2311, 55,1,now(),now());\n") > "m_inits.sql";
	printf("INSERT INTO m_pwds (uid, upass, tenkentantoshaCode, urole,created_at,updated_at) VALUES(1011, 2311, 56,1,now(),now());\n") > "m_inits.sql";
	printf("INSERT INTO m_pwds (uid, upass, tenkentantoshaCode, urole,created_at,updated_at) VALUES(1012, 2311, 57,1,now(),now());\n") > "m_inits.sql";
	printf("INSERT INTO m_pwds (uid, upass, tenkentantoshaCode, urole,created_at,updated_at) VALUES(1013, 2311, 60,1,now(),now());\n") > "m_inits.sql";
	printf("INSERT INTO m_pwds (uid, upass, tenkentantoshaCode, urole,created_at,updated_at) VALUES(1014, 2311, 64,1,now(),now());\n") > "m_inits.sql";
	printf("INSERT INTO m_pwds (uid, upass, tenkentantoshaCode, urole,created_at,updated_at) VALUES(1015, 2311, 68,1,now(),now());\n") > "m_inits.sql";
	printf("INSERT INTO m_pwds (uid, upass, tenkentantoshaCode, urole,created_at,updated_at) VALUES(1016, 2311, 72,1,now(),now());\n") > "m_inits.sql";

	
	printf("UPDATE m_housinginfos SET tenkenteishiY = NULL WHERE tenkenteishiY = 9999;\n") > "m_inits.sql";				
	printf("UPDATE t_check_infos AS TCo SET TCo.jinendotenkenY = TCo.nendo + (  SELECT MHo.tenkenKbn FROM m_housinginfos AS MHo WHERE TCo.bukenCode = MHo.bukenCode AND MHo.tenkenKbn IN (1, 2, 3) );\n") > "m_inits.sql";					
	printf("UPDATE t_check_infos AS TCo SET TCo.jinendotenkenY = TCo.nendo WHERE EXISTS (  SELECT * FROM m_housinginfos AS MHo WHERE TCo.bukenCode = MHo.bukenCode AND MHo.tenkenKbn = 4 );\n")	> "m_inits.sql";
	
	#旧点検名２「その他（特殊建物・設備・指紋認証）」→新点検名６「その他」
	printf("UPDATE t_chktrackrec_infos SET tenkenshubetu = 36 WHERE tenkenshubetu = 32;\n")	> "m_inits.sql";
	printf("UPDATE t_check_infos SET tenkenshubetu = 36 WHERE tenkenshubetu = 32;\n")	> "m_inits.sql";
	printf("UPDATE t_repair_infos SET tenkenshubetu = 36 WHERE tenkenshubetu = 32;\n")	> "m_inits.sql";
	#旧点検名３「その他（電話設備・地下タンク）」→新点検名２「電話」
	printf("UPDATE t_chktrackrec_infos SET tenkenshubetu = 32 WHERE tenkenshubetu = 33;\n")	> "m_inits.sql";
	printf("UPDATE t_check_infos SET tenkenshubetu = 32 WHERE tenkenshubetu = 33;\n")	> "m_inits.sql";
	printf("UPDATE t_repair_infos SET tenkenshubetu = 32 WHERE tenkenshubetu = 33;\n")	> "m_inits.sql";
	
	#部件1306番の削除
	printf("DELETE FROM m_housinginfos WHERE bukenCode = 1306;\n")	> "m_inits.sql";
	printf("DELETE FROM t_housinginfos WHERE bukenCode = 1306;\n")	> "m_inits.sql";
	printf("DELETE FROM t_check_infos WHERE bukenCode = 1306;\n")	> "m_inits.sql";
	printf("DELETE FROM t_chktrackrec_infos WHERE bukenCode = 1306;\n")	> "m_inits.sql";
	printf("DELETE FROM t_repair_infos WHERE bukenCode = 1306;\n")	> "m_inits.sql";
}

END {
	close("m_inits.sql");
}
