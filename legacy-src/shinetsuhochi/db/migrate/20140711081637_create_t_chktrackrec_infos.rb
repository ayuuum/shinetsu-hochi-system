class CreateTChktrackrecInfos < ActiveRecord::Migration
  def change
    create_table :t_chktrackrec_infos do |t|

      t.integer :bukenCode
      t.integer :nendo
      t.integer :checkFlg
      t.integer :setubishubetuKbn
      t.integer :setubishubetu
      t.integer :tenkenshubetuKbn
      t.integer :tenkenshubetu
      t.integer :edaban
      t.integer :tenkenyoteiM
      t.decimal :keiyakukingaku, :precision => 15, :scale => 3
      t.decimal :gaichuhi, :precision => 15, :scale => 3
      t.date :tenkenkanryoYMD
      t.integer :tenkenstatus
      t.decimal :jinko, :precision => 5, :scale => 1
      t.integer :hoshuumu
      t.string :biko, :limit => 1024
      t.integer :hoshukanrenumu

      t.timestamps
    end
  end
end
