class CreateTCheckInfos < ActiveRecord::Migration
  def change
    create_table :t_check_infos do |t|

     t.integer :bukenCode
     t.integer :hachushaCode
     t.integer :nendo
     t.integer :seikyuhouhou
     t.integer :setubishubetuKbn
     t.integer :setubishubetu
     t.integer :tenkenshubetuKbn
     t.integer :tenkenshubetu
     t.integer :nenkantenkenkaisu
     t.integer :tenkenyoteiM1
     t.integer :kaisumeisai
     t.decimal :keiyakukingaku1, :precision => 15, :scale => 3
     t.decimal :keiyakukingaku2, :precision => 15, :scale => 3
     t.integer :boukataishobututenkenkaisu
     t.integer :tenkentantosha1
     t.integer :tenkentantosha2
     t.integer :tenkentantosha3
     t.integer :tenkentantosha4
     t.integer :tenkentantosha5
     t.integer :tenkentantosha6
     t.integer :tenkentantosha7
     t.integer :tenkentantosha8
     t.integer :tenkentantosha9
     t.integer :tenkentantosha10
     t.decimal :gaichuhi1, :precision => 15, :scale => 3
     t.decimal :gaichuhi2, :precision => 15, :scale => 3
     t.decimal :gaichuhi3, :precision => 15, :scale => 3
     t.decimal :gaichuhi4, :precision => 15, :scale => 3
     t.decimal :gaichuhi5, :precision => 15, :scale => 3
     t.decimal :gaichuhi6, :precision => 15, :scale => 3
     t.decimal :gaichuhi7, :precision => 15, :scale => 3
     t.decimal :gaichuhi8, :precision => 15, :scale => 3
     t.decimal :gaichuhi9, :precision => 15, :scale => 3
     t.decimal :gaichuhi10, :precision => 15, :scale => 3
     t.integer :maintantosha
     t.integer :jinendotenkenY

      t.timestamps
    end
  end
end
