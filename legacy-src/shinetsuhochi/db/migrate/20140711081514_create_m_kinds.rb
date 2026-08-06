class CreateMKinds < ActiveRecord::Migration
  def change
    create_table :m_kinds do |t|

      t.integer :shubetuKbn
      t.integer :shubetu
      t.string :shubetumei, :limit => 64

      t.timestamps
    end
  end
end
