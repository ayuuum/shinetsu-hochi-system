class CreateMInits < ActiveRecord::Migration
  def change
    create_table :m_inits do |t|
    
      t.string :tenkenmei1, :limit => 64
      t.string :tenkenmei2, :limit => 64
      t.string :tenkenmei3, :limit => 64
      t.string :tenkenmei4, :limit => 64
      t.string :tenkenmei5, :limit => 64
      t.string :tenkenmei6, :limit => 64
      t.string :tenkenmei7, :limit => 64
      t.string :tenkenmei8, :limit => 64
      t.string :tenkenmei9, :limit => 64
      t.string :tenkenmei10, :limit => 64
      t.string :tenkenstatusmei1, :limit => 64
      t.string :tenkenstatusmei2, :limit => 64
      t.string :tenkenstatusmei3, :limit => 64
      t.string :tenkenstatusmei4, :limit => 64
      t.string :tenkenstatusmei5, :limit => 64
      t.string :hoshustatusmei1, :limit => 64
      t.string :hoshustatusmei2, :limit => 64
      t.string :hoshustatusmei3, :limit => 64
      t.string :hoshustatusmei4, :limit => 64
      t.string :hoshustatusmei5, :limit => 64
      t.string :hoshustatusmei6, :limit => 64
      t.integer :nendokaishiM
      t.integer :zennenY
      t.integer :tounenY
      t.integer :jinenY
      t.integer :kaishinendoM


      t.timestamps
    end
  end
end
