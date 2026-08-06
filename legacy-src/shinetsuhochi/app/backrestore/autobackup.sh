#! /bin/bash
##############################
# @file backup.sh
# @brief データベースをバックアップします
# @author 楊健
# @version 0.8
# @date 2014-11-17
##############################
USER="root"
PASS="pass"
DATABASE="shinetsuhochi_production"

##############################

export PATH=$PATH:/usr/local/mysql/bin #mysqlの位置を指定する

date

#---------------------------------
# ステータスのチェック
status=`mysql -u$USER -p$PASS $DATABASE <<EOF | tail -n +2
SELECT sstatus from m_sysstatuses;
EOF`
if [ $status != "0" ]
then
	echo "システムステータスは[$status]ですので、バックアップ中止した！"
	exit 1
fi

echo -e "\nバックアップ開始します！"
# バックアップ
mysql -u$USER -p$PASS $DATABASE <<EOF
	UPDATE m_sysstatuses SET sstatus = 2
EOF

year=`date +%Y`
month=`date +%m`
filename=`date +%Y%m%d%H%M`
#↓テスト環境
#backupdir="/var/www/shinetsuhochi/db/backup/$year/$month/" 
#↓本番環境（ディレクトリが異なる）
backupdir="/var/www/shinetsuhochi/shinetsuhochi/db/backup/$year/$month/"
#echo -e "backupdir=$backupdir\n"
mkdir -p $backupdir

mysqldump -u$USER -p$PASS $DATABASE > $backupdir$filename.sql
echo -e "$backupdir$filename.sql\n"

mysql -u$USER -p$PASS $DATABASE <<EOF
	UPDATE m_sysstatuses SET sstatus = 0
EOF

echo "バックアップ完了しました！！"
date

ryear=`expr $year - 4`


#removedir="/var/www/shinetsuhochi/db/backup/$ryear/$month/" 

removedir="/var/www/shinetsuhochi/shinetsuhochi/db/backup/$ryear/$month/" 
echo -e "removedir=$removedir\n"
rm -rf $removedir

cd /var/www/shinetsuhochi/shinetsuhochi
rake log:clear
rails runner -e production "ActiveRecord::SessionStore::Session.delete_all(['updated_at < ?',5.days.ago])" 

exit 0

