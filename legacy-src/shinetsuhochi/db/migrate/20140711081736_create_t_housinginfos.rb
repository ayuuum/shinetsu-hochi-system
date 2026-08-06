class CreateTHousinginfos < ActiveRecord::Migration
  def change
    create_table :t_housinginfos do |t|

      t.integer :bukenCode
      t.integer :hachushaCode
      t.integer :nendo
      t.string :bukenmei, :limit => 128
      t.string :bukenPostno, :limit => 8
      t.string :bukenAdrs, :limit => 128
      t.string :bukenTelno, :limit => 64
      t.string :bukenFaxno, :limit => 64
      t.string :bukenTandoshamei, :limit => 64

      t.timestamps
    end
  end
end
