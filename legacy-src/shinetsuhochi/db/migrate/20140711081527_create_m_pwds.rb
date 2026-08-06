class CreateMPwds < ActiveRecord::Migration
  def change
    create_table :m_pwds do |t|

      t.integer :uid
      t.integer :upass
      t.integer :tenkentantoshaCode
      t.integer :urole

      t.timestamps
    end
  end
end
