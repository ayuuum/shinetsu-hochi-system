#! /bin/bash

USER="root"
PASS="pass"
DATABASE="shinetsuhochi_production"

export PATH=$PATH:/usr/local/mysql/bin/

date

status=`mysql -u$USER -p$PASS $DATABASE <<EOF | tail -n +2
SELECT sstatus from m_sysstatuses;
EOF`
if [ $status != "0" ]
then
    echo "The system status is [$status],exit!"
    exit 1
fi

echo -e "\nBackup start!------"
mysql -u$USER -p$PASS $DATABASE <<EOF
    UPDATE m_sysstatuses SET sstatus = 2
EOF

year=`date +%Y`
month=`date +%m`
filename=`date +%Y%m%d%H%M`
backupdir="/var/www/shinetsuhochi/shinetsuhochi/db/backup/$year/$month/"
mkdir -p $backupdir

mysqldump -u$USER -p$PASS $DATABASE > $backupdir$filename.sql
echo -e "$backupdir$filename.sql\n"
mysql -u$USER -p$PASS $DATABASE << EOF
    UPDATE m_sysstatuses SET sstatus = 3
EOF

echo "Backup completed!------"
date
exit 0
