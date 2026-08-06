class CreateMOrderingpatries < ActiveRecord::Migration
  def change
    create_table :m_orderingpatries do |t|

      t.integer :hachushaCode
      t.integer :edaban
      t.string :hachushamei, :limit => 128
      t.string :hachuPostno, :limit => 8
      t.string :hachuAdrs, :limit => 128
      t.string :hachuTelno, :limit => 64
      t.string :hachuFaxno, :limit => 64
      t.string :hachuTandoshamei, :limit => 64
      t.integer :sakujyoFlg

      t.timestamps
    end
  end
end
