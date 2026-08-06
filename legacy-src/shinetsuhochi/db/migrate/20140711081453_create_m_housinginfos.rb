class CreateMHousinginfos < ActiveRecord::Migration
  def change
    create_table :m_housinginfos do |t|

      t.integer :bukenCode
      t.string :bukenmei, :limit => 128
      t.integer :saishusakuseiY
      t.integer :tenkenkaishiY
      t.integer :tenkenKbn
      t.string :memo1, :limit => 1024
      t.integer :teishiFlg
      t.integer :tenkenteishiY
      t.integer :tenkenjyohoumuFlg
      t.string :memo2, :limit => 1024

      t.timestamps
    end
  end
end
