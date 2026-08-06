class CreateMSysstatuses < ActiveRecord::Migration
  def change
    create_table :m_sysstatuses do |t|

      t.integer :sstatus

      t.timestamps
    end
  end
end
