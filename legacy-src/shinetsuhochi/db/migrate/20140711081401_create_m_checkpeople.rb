class CreateMCheckpeople < ActiveRecord::Migration
  def change
    create_table :m_checkpeople do |t|

      t.integer :tenkentantoshaCode
      t.string :tenkentantoshamei, :limit => 64
      t.integer :tenkentantoshashubetuKbn
      t.integer :tenkentantoshashubetu
      t.integer :sakujyoFlg

      t.timestamps
    end
  end
end
