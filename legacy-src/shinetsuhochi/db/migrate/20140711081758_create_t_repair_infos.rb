class CreateTRepairInfos < ActiveRecord::Migration
  def change
    create_table :t_repair_infos do |t|

      t.integer :bukenCode
      t.integer :nendo
      t.integer :setubishubetuKbn
      t.integer :setubishubetu
      t.integer :tenkenshubetuKbn
      t.integer :tenkenshubetu
      t.integer :tenkenyoteiM
      t.integer :edaban
      t.date :haseiYMD
      t.date :hoshukanryoYMD
      t.integer :hoshuStatus
      t.string :mitumorinaiyou, :limit => 1024

      t.timestamps
    end
  end
end
