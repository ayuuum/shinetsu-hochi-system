#! /bin/bash  
##############################
# @file convert.sh
# @brief Accessデータベースからデータを変換してMYSQLに導入する
# @author 楊健
# @version 1.0
# @date 2014-11-04
##############################
USER="root"
DATABASE="shinetsuhochi_production"

##############################

export PATH=$PATH:/usr/local/mysql/bin #mysqlの位置を指定する

echo "Convert start！"
date

#---------------------------------
# M点検担当者.txt
echo "---------------------------------------"
echo "m_checkpeople.txt -> m_checkpeople"

awk -f m_checkpeople.awk mt.txt
STATEMENT="delete from m_checkpeople; source m_checkpeople.sql;"
mysql -u $USER $DATABASE << EOF
	$STATEMENT
EOF

echo "m_checkpeople -> m_checkpeople OK!"
echo "---------------------------------------"

#---------------------------------
# M発注者.txt
echo "m_orderingpatries.txt -> m_orderingpatries"

awk -f m_orderingpatries.awk mh.txt
STATEMENT="delete from m_orderingpatries; source m_orderingpatries.sql;"
mysql -u $USER $DATABASE << EOF
	$STATEMENT
EOF

echo "m_orderingpatries.txt -> m_orderingpatries OK!"
echo "---------------------------------------"

#---------------------------------
# M物件.txt
echo "m_housinginfos.txt -> m_housinginfos"
awk -f m_housinginfos.awk mb.txt
STATEMENT="delete from m_housinginfos; source m_housinginfos.sql;"
mysql -u $USER $DATABASE << EOF
	$STATEMENT
EOF

echo "m_housinginfos.txt -> m_housinginfos OK!"
echo "---------------------------------------"

#---------------------------------
# T点検情報.txt
echo "t_check_infos.txt -> t_check_infos"

awk -f t_check_infos.awk tt.txt
STATEMENT="delete from t_check_infos; source t_check_infos.sql;"
mysql -u $USER $DATABASE << EOF
	$STATEMENT
EOF

echo "t_check_infos -> t_check_infos OK!"
echo "---------------------------------------"

#---------------------------------
# T物件情報.txt
echo "t_housinginfos.txt -> t_housinginfos"

awk -f t_housinginfos.awk  tb.txt
STATEMENT="delete from t_housinginfos; source t_housinginfos.sql;"
mysql -u $USER $DATABASE << EOF
	$STATEMENT
EOF

echo "t_housinginfos.txt -> t_housinginfos OK!"
echo "---------------------------------------"

#---------------------------------
# T点検実績情報.txt
echo "t_chktrackrec_infos.txt -> t_chktrackrec_infos"
awk -f t_chktrackrec_infos.awk ttj.txt
STATEMENT="delete from t_chktrackrec_infos; source t_chktrackrec_infos.sql;"
mysql -u $USER $DATABASE << EOF
	$STATEMENT
EOF

echo "t_chktrackrec_infos.txt -> t_chktrackrec_infos OK!"
echo "---------------------------------------"

#---------------------------------
# T補修情報.txt
echo "t_repair_infos.txt -> t_repair_infos"

awk -f t_repair_infos.awk th.txt
STATEMENT="delete from t_repair_infos; source t_repair_infos.sql;"
mysql -u $USER $DATABASE << EOF
	$STATEMENT
EOF

echo "t_repair_infos.txt -> t_repair_infos OK!"
echo "---------------------------------------"

#---------------------------------
# M初期設定.txt 
echo "m_inits.txt -> m_inits"

echo "null" |awk -f m_inits.awk #ファイルの代わりにnullをawkに渡します
STATEMENT="delete from m_inits; source m_inits.sql;"
mysql -u $USER $DATABASE << EOF
	$STATEMENT
EOF

echo "m_inits.txt -> m_inits OK!"
echo "---------------------------------------"

echo "Convert completed！"
date
exit

