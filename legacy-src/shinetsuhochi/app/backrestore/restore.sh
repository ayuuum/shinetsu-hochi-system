#! /bin/bash

USER="root"
PASS="pass"
DATABASE="shinetsuhochi_production"

export PATH=$PATH:/usr/local/mysql/bin/

date

echo -e "\nRestore start!------"
if [ $# -ne 1 ]
then 
    echo "Please select a retore file first!"
    exit 1
fi

echo $1
if [ -f $1 ];then
    STATMENT="UPDATE m_sysstatuses SET sstatus = 4;source $1;UPDATE m_sysstatuses SET sstatus = 0;"
mysql -u$USER -p$PASS $DATABASE << EOF
    $STATMENT
EOF

    echo "Restore completed!------"
    date
    exit 0
else
    echo "Error!"
fi
