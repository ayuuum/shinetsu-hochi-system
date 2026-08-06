class CreateMMentes < ActiveRecord::Migration
  def change
    create_table :m_mentes do |t|

      t.integer :youbi
      t.integer :kaishijikan
      t.integer :shuryojikan

      t.timestamps
    end
  end
end
